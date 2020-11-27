import { BaseSerializer } from "./BaseSerializer";
import {
	ObjectSerializerImpl,
	IntersectionSerializerImpl,
	UnionSerializerImpl,
	LiteralSerializerImpl,
	MapSerializerImpl,
	ArraySerializerImpl,
	AnySerializerImpl,
	NamedSerializerImpl,
	LazySerializerImpl,
	StringSerializerImpl,
	BooleanSerializerImpl,
	NumberSerializerImpl,
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

/**
 * Represents an immutable and reflectable serializer/deserializer.
 */
export type Serializer<T = any> = (
	| AnySerializerImpl["TInterface"]
	| UnionSerializerImpl<any>["TInterface"]
	| LazySerializerImpl<any>["TInterface"]
	| RefinedSerializerImpl<any, any>["TInterface"]
	| NamedSerializerImpl<any>["TInterface"]
	| StringSerializerImpl["TInterface"]
	| NumberSerializerImpl["TInterface"]
	| BooleanSerializerImpl["TInterface"]
	| LiteralSerializerImpl<any>["TInterface"]
	| ObjectSerializerImpl<any>["TInterface"]
	| IntersectionSerializerImpl<any>["TInterface"]
	| ArraySerializerImpl<any>["TInterface"]
	| MapSerializerImpl<any>["TInterface"]
) &
	BaseSerializer<T>;
