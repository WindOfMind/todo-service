export const validateString = function (value: string, key: string, minLength?: number, maxLength?: number) {
    if (minLength !== undefined) {
        if (value.length < minLength) {
            return {
                error: `The min length for ${key} is ${minLength}`
            };
        }
    }

    if (maxLength !== undefined) {
        if (value.length > maxLength) {
            return {
                error: `The max length for ${key} is ${maxLength}`
            };
        }
    }

    return {
        validated: value
    };
};
