import {AppContext} from "../context.js";
import {IntegrationName} from "./userIntegration.js";
import {userIntegrationService} from "./userIntegrationService.js";

export const userIntegrationTypeDefs = `#graphql
    enum IntegrationName {
        TODOIST
    }

    type Mutation {
        addUserIntegration(userId: Int!, integrationName: IntegrationName!, accessToken: String!): ID!
    }
`;

interface AddUserIntegrationRequest {
    userId: number;
    name: IntegrationName;
    accessToken: string;
}

// Exposed for testing purpose - for production version should be exposed only internally
export const userIntegrationMutations = {
    addUserIntegration: (_: unknown, args: AddUserIntegrationRequest, contextValue: AppContext) => {
        return userIntegrationService.addUserIntegration(contextValue.db, {
            userId: args.userId,
            integrationName: args.name,
            accessToken: args.accessToken
        });
    }
};
