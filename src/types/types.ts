import { BaseType } from "./BaseType";
import { TypeDefinition } from "./TypeDefinition";
import {
	StringType,
	BooleanType,
	NumberType,
	AnyType,
	NullType,
} from "./primitiveTypes";
import { UnionType } from "./UnionType";
import { IntersectionType } from "./IntersectionType";
import { LiteralType } from "./LiteralType";
import { ArrayType } from "./ArrayType";
import { ObjectType } from "./ObjectType";
import { MapType } from "./MapType";

export type Type<T = any> =
	| TypeDefinition<T>
	| UnionType<T>
	| IntersectionType<Type<T>[]>
	| (T extends string | number | boolean ? LiteralType<T> : never)
	| (T extends Record<string, unknown> ? ObjectType<T> : never)
	| (T extends (infer TItem)[] ? ArrayType<TItem> : never)
	| (T extends number ? NumberType : never)
	| (T extends string ? StringType : never)
	| (T extends boolean ? BooleanType : never)
	| (T extends null ? NullType : never)
	| AnyType
	| (T extends Record<string, unknown> ? MapType : never);

export type Exclude<
	TType extends Type,
	T extends Type["kind"]
> = TType extends { kind: T } ? never : TType;
export type ExcludeType<T extends Type["kind"]> = Exclude<Type, T>;

type Narrow<T, K> = T extends K ? T : never;
export type NarrowType<TKind extends Type["kind"]> = Narrow<
	Type,
	{ kind: TKind }
>;
