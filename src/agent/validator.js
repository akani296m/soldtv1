/**
 * Action Validator
 * 
 * Validates that actions emitted by Claude conform to the schema.
 * If an action is invalid, it is REJECTED - no exceptions.
 */

import { ACTION_TYPES, ACTION_SCHEMAS } from './types';

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the action is valid
 * @property {string[]} errors - Array of error messages
 * @property {Object} [sanitized] - Sanitized action payload (if valid)
 */

/**
 * Validate a single action
 * @param {Object} action - The action to validate
 * @returns {ValidationResult}
 */
export function validateAction(action) {
    const errors = [];

    // Check action structure
    if (!action || typeof action !== 'object') {
        return { valid: false, errors: ['Action must be an object'] };
    }

    // Check action type exists
    if (!action.type) {
        return { valid: false, errors: ['Action must have a "type" property'] };
    }

    // Check action type is valid
    const validTypes = Object.values(ACTION_TYPES);
    if (!validTypes.includes(action.type)) {
        return {
            valid: false,
            errors: [`Invalid action type: "${action.type}". Valid types: ${validTypes.join(', ')}`]
        };
    }

    // Get schema for this action type
    const schema = ACTION_SCHEMAS[action.type];
    if (!schema) {
        return { valid: false, errors: [`No schema defined for action type: ${action.type}`] };
    }

    // Validate payload against schema
    const payload = action.payload || {};
    const payloadErrors = validatePayload(payload, schema, action.type);
    errors.push(...payloadErrors);

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Return sanitized action
    return {
        valid: true,
        errors: [],
        sanitized: {
            type: action.type,
            payload: sanitizePayload(payload, schema),
        },
    };
}

/**
 * Validate action payload against schema
 * @param {Object} payload - The action payload
 * @param {Object} schema - The validation schema
 * @param {string} actionType - The action type (for error messages)
 * @returns {string[]} Array of error messages
 */
function validatePayload(payload, schema, actionType) {
    const errors = [];

    // Check required fields
    if (schema.required) {
        for (const field of schema.required) {
            if (payload[field] === undefined || payload[field] === null) {
                errors.push(`${actionType}: Missing required field "${field}"`);
            }
        }
    }

    // Validate each provided field
    if (schema.properties) {
        for (const [field, value] of Object.entries(payload)) {
            const fieldSchema = schema.properties[field];

            // Unknown field - skip (we'll strip it in sanitization)
            if (!fieldSchema) continue;

            // Type validation
            const fieldErrors = validateField(field, value, fieldSchema, actionType);
            errors.push(...fieldErrors);
        }
    }

    return errors;
}

/**
 * Validate a single field
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {Object} schema - Field schema
 * @param {string} actionType - Action type for error messages
 * @returns {string[]} Array of error messages
 */
function validateField(field, value, schema, actionType) {
    const errors = [];
    const prefix = `${actionType}.${field}`;

    // Type check
    switch (schema.type) {
        case 'string':
            if (typeof value !== 'string') {
                errors.push(`${prefix}: Expected string, got ${typeof value}`);
            } else {
                if (schema.minLength && value.length < schema.minLength) {
                    errors.push(`${prefix}: String too short (min: ${schema.minLength})`);
                }
                if (schema.maxLength && value.length > schema.maxLength) {
                    errors.push(`${prefix}: String too long (max: ${schema.maxLength})`);
                }
                if (schema.enum && !schema.enum.includes(value)) {
                    errors.push(`${prefix}: Invalid value "${value}". Must be one of: ${schema.enum.join(', ')}`);
                }
            }
            break;

        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                errors.push(`${prefix}: Expected number, got ${typeof value}`);
            } else {
                if (schema.min !== undefined && value < schema.min) {
                    errors.push(`${prefix}: Number too small (min: ${schema.min})`);
                }
                if (schema.max !== undefined && value > schema.max) {
                    errors.push(`${prefix}: Number too large (max: ${schema.max})`);
                }
            }
            break;

        case 'boolean':
            if (typeof value !== 'boolean') {
                errors.push(`${prefix}: Expected boolean, got ${typeof value}`);
            }
            break;

        case 'array':
            if (!Array.isArray(value)) {
                errors.push(`${prefix}: Expected array, got ${typeof value}`);
            } else if (schema.items) {
                // Validate array items
                value.forEach((item, index) => {
                    if (schema.items.type === 'string' && typeof item !== 'string') {
                        errors.push(`${prefix}[${index}]: Expected string item`);
                    }
                });
            }
            break;

        case 'object':
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                errors.push(`${prefix}: Expected object, got ${typeof value}`);
            }
            break;
    }

    return errors;
}

/**
 * Sanitize payload - remove unknown fields, apply defaults
 * @param {Object} payload - The payload to sanitize
 * @param {Object} schema - The validation schema
 * @returns {Object} Sanitized payload
 */
function sanitizePayload(payload, schema) {
    const sanitized = {};

    if (!schema.properties) return payload;

    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (payload[field] !== undefined) {
            // Trim strings
            if (fieldSchema.type === 'string' && typeof payload[field] === 'string') {
                sanitized[field] = payload[field].trim();
            } else {
                sanitized[field] = payload[field];
            }
        }
    }

    return sanitized;
}

/**
 * Validate an array of actions
 * @param {Object[]} actions - Array of actions to validate
 * @returns {{ valid: boolean, results: ValidationResult[], validActions: Object[] }}
 */
export function validateActions(actions) {
    if (!Array.isArray(actions)) {
        return {
            valid: false,
            results: [{ valid: false, errors: ['Expected array of actions'] }],
            validActions: [],
        };
    }

    const results = actions.map(action => validateAction(action));
    const validActions = results
        .filter(r => r.valid)
        .map(r => r.sanitized);

    return {
        valid: results.every(r => r.valid),
        results,
        validActions,
    };
}

/**
 * Parse and validate JSON actions from LLM response
 * @param {string} llmResponse - Raw LLM response string
 * @returns {{ success: boolean, actions: Object[], errors: string[] }}
 */
export function parseAndValidateActions(llmResponse) {
    const errors = [];

    // Try to extract JSON array from response
    let actionsJson;

    try {
        // Look for JSON array in the response
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            // Try looking for a JSON object (single action)
            const objMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (objMatch) {
                actionsJson = [JSON.parse(objMatch[0])];
            } else {
                return {
                    success: false,
                    actions: [],
                    errors: ['No valid JSON found in response'],
                };
            }
        } else {
            actionsJson = JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        return {
            success: false,
            actions: [],
            errors: [`Failed to parse JSON: ${e.message}`],
        };
    }

    // Validate all actions
    const validation = validateActions(actionsJson);

    return {
        success: validation.valid,
        actions: validation.validActions,
        errors: validation.results
            .filter(r => !r.valid)
            .flatMap(r => r.errors),
    };
}
