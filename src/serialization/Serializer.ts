import { BaseSerializer } from "./BaseSerializer";
import {
	PrimitiveSerializerImpl,
	ObjectSerializerImpl,
	IntersectionSerializerImpl,
	UnionSerializerImpl,
	LiteralSerializerImpl,
	MapSerializerImpl,
	ArraySerializerImpl,
	AnySerializerImpl,
	NamedSerializerImpl,
	LazySerializerImpl,
} from "./serializers";
import { RefinedSerializerImpl } from "./serializers/RefinedSerializerImpl";

export type Narrow<T, TFilter> = T extends TFilter ? T : never;

export type SerializerOfKind<TKind extends Serializer<any>["kind"], T> = Narrow<
	Serializer<T>,
	{ kind: TKind }
>;

export type SerializerOf<TFilter extends Partial<Serializer<any>>, T> = Narrow<
	Serializer<T>,
	TFilter
>;

export type NamedSerializer<T> = BaseSerializer<T> &
	NamedSerializerImpl<any>["TInterface"];

export type Serializer<T = any> = (
	| AnySerializerImpl["TInterface"]
	| UnionSerializerImpl<any>["TInterface"]
	| LazySerializerImpl<any>["TInterface"]
	| RefinedSerializerImpl<any, any>["TInterface"]
	| NamedSerializerImpl<any>["TInterface"]
	| PrimitiveSerializerImpl<any>["TInterface"]
	| LiteralSerializerImpl<any>["TInterface"]
	| ObjectSerializerImpl<any>["TInterface"]
	| IntersectionSerializerImpl<any>["TInterface"]
	| ArraySerializerImpl<any>["TInterface"]
	| MapSerializerImpl<any>["TInterface"]
) &
	BaseSerializer<T>;

/*
	type GetType<T> = Omit<T, "deserialize" | "T" | "serialize">;

export type Serializer2<T = any> = (
	| GetType<UnionSerializer<T>>
	| GetType<DelegatingSerializer<T, any>>
	| (T extends number | string | boolean
			? GetType<
					PrimitiveSerializer<
						T extends number
							? "number"
							: T extends string
							? "string"
							: T extends boolean
							? "boolean"
							: never
					>
			  >
			: never)
	| (T extends LiteralType ? GetType<LiteralSerializer<T>> : never)
	| (T extends Record<string, any> ? GetType<ObjectSerializer<T>> : never)
	| (T extends any[] ? GetType<IntersectionSerializer<T>> : never)
) &
	BaseSerializer<T>;
*/
