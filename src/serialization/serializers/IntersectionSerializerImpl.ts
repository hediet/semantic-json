import { BaseSerializerImpl } from "../BaseSerializer";
import {
	ObjectSerializerImpl,
	ObjectPropInfo,
	ObjectSerializerProperty,
	sProp,
	sObject,
} from "./ObjectSerializerImpl";
import { Serializer, SerializerOfKind } from "../Serializer";
import { JSONValue } from "../../JSONValue";
import { DeserializeContext } from "../DeserializeContext";
import { DeserializeResult, DeserializeError } from "../DeserializeResult";
import { SerializeContext } from "../SerializeContext";
import { sUnionMany, sIntersectionMany } from "../facade";

export interface IntersectionSerializer {
	kind: "intersection";
	intersectedSerializers: Serializer<unknown>[];
}

export class IntersectionSerializerImpl<T extends unknown[]>
	extends BaseSerializerImpl<T, IntersectionSerializer>
	implements IntersectionSerializer {
	public readonly kind = "intersection";

	constructor(
		public readonly intersectedSerializers: {
			[TName in keyof T]: Serializer<T[TName]>;
		}
	) {
		super();
	}

	protected internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<T> {
		const innerContext = context.withoutFirstDeserializationOnValue();
		const errors = new Array<DeserializeError>();
		const result = new Array<any>();
		const participatedClosedObjects = new Array<
			ObjectSerializerImpl<any>
		>();

		for (const s of this.intersectedSerializers) {
			const r = s.deserialize(source, innerContext);
			if (r.errors.length > 0) {
				errors.push(...r.errors);
			}
			result.push(r.hasValue ? r.value : undefined);
			participatedClosedObjects.push(...r.participatedClosedObjects);
		}

		return new DeserializeResult(
			true,
			result as any,
			errors,
			participatedClosedObjects
		);
	}

	protected internalCanSerialize(value: unknown): value is T {
		return Array.isArray(value);
	}

	protected internalSerialize(
		value: T,
		context: SerializeContext
	): JSONValue {
		return Object.assign(
			{},
			...value.map((val, idx) =>
				this.intersectedSerializers[idx].serialize(val)
			)
		);
	}
}

export type UnionToIntersection<U> = (
	U extends any ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never;

// fuse?
export function buildObjectSerializer(
	intersectedSerializers: readonly Serializer<any>[]
): Serializer<any> {
	const objectTypes = intersectedSerializers
		.map(getUnderlyingSerializer)
		.filter((s) => s.underlyingSerializer.kind === "object");

	let resultProperties:
		| Record<string, ObjectSerializerProperty<any>>
		| undefined = undefined;
	for (const o of objectTypes) {
		if (o.underlyingSerializer.kind !== "object") {
			throw "impossible";
		}

		if (resultProperties) {
			for (const [key, val] of Object.entries(
				o.underlyingSerializer.properties
			)) {
				if (!resultProperties[key]) {
					resultProperties[key] = val;
				} else {
					const existing = resultProperties[key];

					resultProperties[key] = new ObjectSerializerProperty(
						key,
						sIntersectionMany([
							existing.serializer,
							val.serializer,
						]),
						existing.description,
						existing.isOptional && val.isOptional,
						existing.defaultValue // argh
					);
				}
			}
		} else {
			resultProperties = {};
			Object.assign(resultProperties, o.underlyingSerializer.properties);
		}
	}

	return sObject(resultProperties!);
}

function getUnderlyingSerializer<T>(
	serializer: Serializer<T>
): {
	underlyingSerializer: SerializerOfKind<
		Exclude<Serializer["kind"], "delegation">,
		any
	>;
	transformation(
		source: DeserializeResult<any>,
		context: DeserializeContext
	): DeserializeResult<T>;
} {
	if (serializer.kind !== "delegation") {
		return {
			underlyingSerializer: serializer,
			transformation: (source, context) => source,
		};
	}
	const { transformation, underlyingSerializer } = getUnderlyingSerializer(
		serializer.underlyingSerializer
	);

	return {
		underlyingSerializer,
		transformation: (source, context) => {
			const result = transformation(source, context);
			return serializer.refineSource(source, context);
		},
	};
}
