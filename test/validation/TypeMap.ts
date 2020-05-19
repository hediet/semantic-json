import { deepEqual } from "assert";
import { Type } from "../../src/types";
import { ValidationContext, TypeAnnotation } from "../../src/types/BaseType";

interface TypeMap {
	(name: string, type: Type<any>): Type<any>;
	getName(type: Type<any>): string;
}
function newTypeMap(): TypeMap {
	const m = new Map<Type, string>();
	function f(name: string, type: Type<any>): Type<any> {
		m.set(type, name);
		return type;
	}
	f.getName = (type: Type<any>): string => {
		return m.get(type)!;
	};
	return f;
}

export type TypeAnnotation2 =
	| {
			kind: "specific";
			type: string;
	  }
	| {
			kind: "object";
			type: string;
			properties: Record<string, TypeAnnotation2>;
	  }
	| {
			kind: "array";
			type: string;
			items: TypeAnnotation2[];
	  }
	| {
			kind: "abstract";
			type: string;
			specificTypes: TypeAnnotation2[];
	  };

export function testValidation(
	type: Type<any>,
	data: any,
	typeVal: any,
	map: TypeMap
) {
	const result = type.validate(data, new ValidationContext());
	if (!result.isOk) {
		throw new Error("Should ok.");
	}

	function mapType(a: TypeAnnotation): TypeAnnotation2 {
		if (a.kind === "abstract") {
			return {
				kind: "abstract",
				type: map.getName(a.type),
				specificTypes: a.specificTypes.map(mapType),
			};
		} else if (a.kind === "array") {
			return {
				kind: "array",
				type: map.getName(a.type),
				items: a.items.map(mapType),
			};
		} else if (a.kind === "object") {
			return {
				kind: "object",
				type: map.getName(a.type),
				properties: Object.fromEntries(
					Object.entries(a.properties).map(([key, val]) => [
						key,
						mapType(val),
					])
				),
			};
		} else if (a.kind === "specific") {
			return {
				kind: "specific",
				type: map.getName(a.type),
			};
		} else {
			throw "";
		}
	}

	deepEqual(mapType(result.value.type), typeVal);
}

export const t = newTypeMap();
