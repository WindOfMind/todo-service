import {validatePagination} from "../../main/common/pagination.js";

describe("validatePagination", () => {
    it("should return validated pagination", () => {
        const pagination = {
            first: 100,
            after: "1"
        };

        const validated = validatePagination(pagination);

        expect(validated).toEqual(pagination);
    });

    it("should trim first value", () => {
        const pagination = {
            first: 100
        };

        const validated = validatePagination(pagination, 10);

        expect(validated.first).toBe(10);
    });

    it("should use default if there is no first value", () => {
        const pagination = {
            first: undefined
        };

        const validated = validatePagination(pagination, 100, 10);

        expect(validated.first).toBe(10);
    });

    it("should return undefined if after is not numeric", () => {
        const pagination = {
            after: "not-numeric"
        };

        const validated = validatePagination(pagination);

        expect(validated.after).toBe(undefined);
    });
});
