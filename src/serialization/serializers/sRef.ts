import { JSONValue, TypeSystem, Type } from "../..";
import { NamedSerializer } from "./NamedSerializer";
import { BaseSerializer } from "./BaseSerializer";
import { DelegatingSerializer } from "./DelegatingSerializer";
import { Serializer } from "..";

export function sRef<TValue, TSource extends JSONValue>(
	serializerRef: () => NamedSerializer<TValue, TSource>
): BaseSerializer<TValue, TSource> {
	return new RefSerializer(serializerRef);
}

class RefSerializer<
	TValue,
	TSource extends JSONValue
> extends DelegatingSerializer<TValue, TSource> {
	private cached: Serializer<TValue, TSource> | undefined = undefined;

	get underlyingSerializer(): Serializer<TValue, TSource> {
		if (!this.cached) {
			this.cached = this.serializerRef();
		}
		return this.cached;
	}

	constructor(
		private readonly serializerRef: () => Serializer<TValue, TSource>
	) {
		super();
	}

	public getType(typeSystem: TypeSystem): Type {
		return this.underlyingSerializer.getType(typeSystem);
	}
}
