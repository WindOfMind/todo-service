import {isEmpty} from "../../main/utils/common.js";
import {validateString} from "../../main/utils/validation.js";

describe("isEmpty", () => {
    it("should return true if object is empty", () => {
        const obj = {};

        const result = isEmpty(obj);

        expect(result).toBeTruthy();
    });

    it("should return false if object is not empty", () => {
        const obj = {
            test: "test"
        };

        const result = isEmpty(obj);

        expect(result).toBeFalsy();
    });
});

describe("validateString", () => {
    it("should return no error if string is valid", () => {
        const validString = "test";

        const validation = validateString(validString, "test", 1, 10);

        expect(validation.validated).toEqual(validString);
        expect(validation.error).toBeUndefined();
    });

    it("should return error if string is shorter than limit", () => {
        const invalidString = "test";

        const validation = validateString(invalidString, "test", 5, 10);

        expect(validation.validated).toBeUndefined();
        expect(validation.error).not.toEqual("");
    });

    it("should return error if string is longer than limit", () => {
        const invalidString = "test";

        const validation = validateString(invalidString, "test", 1, 3);

        expect(validation.validated).toBeUndefined();
        expect(validation.error).not.toEqual("");
    });
});
