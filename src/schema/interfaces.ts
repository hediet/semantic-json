export interface TypePackageInterface {
	packageId: string;
	typeDefinitions: Record<string, TypeInterface>;
}

export type TypeInterface =
	| UnionTypeInterface
	| IntersectionTypeInterface
	| StringTypeInterface
	| BooleanTypeInterface
	| NumberTypeInterface
	| ObjectTypeInterface
	| ArrayTypeInterface
	| TypeRefInterface
	| CustomTypeInterface;

export type TypeRefInterface = string;

export interface CustomTypeInterface {
	$type: string;
}

export interface UnionTypeInterface {
	kind: "union";
	of: TypeInterface[];
}

export interface IntersectionTypeInterface extends Array<TypeInterface> {}

export interface StringTypeInterface {
	kind: "string";
}

export interface NumberTypeInterface {
	kind: "number";
}

export interface BooleanTypeInterface {
	kind: "boolean";
}

export interface ObjectTypeInterface {
	kind: "object";

	properties?: Record<string, ObjectPropertyInterface>;
}

export interface ObjectPropertyInterface {
	optional?: boolean;
	defaultValue?: unknown;
	type: TypeInterface;
}

export interface ArrayTypeInterface {
	kind: "array";
	of: TypeInterface;
}
