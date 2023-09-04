export const typeDefs = `#graphql
    type List {
        name: String
    }

    type Query {
        lists: [List]
    }
`;

export const resolvers = {
    Query: {
        lists: () => lists
    }
};

const lists = [
    {
        name: "Today"
    },
    {
        name: "Tomorrow"
    }
];
