type SchemaDefinitions = {
	packageId: string;
	schemaDefinitions: Record<string, Type>;
};

type Type =
	| ((
			| UnionType
			| IntersectionType
			| StringType
			| BooleanType
			| NumberType
			| AnyType
			| LiteralType
			| ObjectType
			| MapType
			| ArrayType
	  ) & { constraints?: any[] })
	| TypeReference;

const defs: SchemaDefinitions = {
	packageId: "test",
	schemaDefinitions: {
		centimeter: { kind: "number", constraints: [{}] },
		contact: {
			kind: "object",
			properties: {
				id: { schema: { kind: "string" } },
				name: { schema: { kind: "string" } },
				height: {
					schema: [
						"test#centimeter",
						{
							kind: "any",
							constraints: [{ $type: "test#IntegerConstraint" }],
						},
					],
				},
			},
		},
	},
};

type UnionType = {
	kind: "union";
	of: Type[];
};

type IntersectionType = Type[];

type StringType = {
	kind: "string";
};

type BooleanType = {
	kind: "boolean";
};

type NumberType = {
	kind: "number";
};

type AnyType = {
	kind: "any";
};

type LiteralType =
	| {
			kind: "literal";
			value: string | number | boolean;
	  }
	| {
			kind: "null";
	  };

type ObjectType = {
	kind: "object";
	properties: Record<string, ObjectProperty>;
};

type ObjectProperty = {
	schema: Type;
	optional?: boolean;
};

type MapType = {
	kind: "map";
	valueType: Type;
};

type ArrayType = {
	kind: "array";
	of: Type;
};

type TypeReference = string;
