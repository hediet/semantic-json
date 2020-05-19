import { JSONValue } from "../JSONValue";

export type Types = {
	array: any[];
	string: string;
	number: number;
	null: null;
	object: Record<string, any>;
	boolean: boolean;
};

export function getTypeMismatchMessage(
	value: JSONValue,
	expected:
		| { type: keyof Types }
		| { value: Types["string" | "number" | "boolean" | "null"] }
): string {
	let expectedMsg = "";
	let expectedType: keyof Types;
	if ("type" in expected) {
		expectedMsg = `Expected a value of type "${expected.type}"`;
		expectedType = expected.type;
	} else {
		expectedMsg = `Expected "${expected.value}"`;
		expectedType = getType(expected.value);
	}

	if (value === null) {
		return `${expectedMsg}, but got "null".`;
	}

	let butGotMessage: string;
	const valueType = getType(value);
	if (valueType === expectedType) {
		butGotMessage = `but got "${value}"`;
	} else {
		butGotMessage = `but got a value of type "${valueType}"`;
	}

	return `${expectedMsg}, ${butGotMessage}.`;
}

function getType(value: JSONValue): keyof Types {
	if (value === null) {
		return "null";
	} else if (Array.isArray(value)) {
		return "array";
	}
	const type = typeof value;
	if (
		type === "bigint" ||
		type === "function" ||
		type === "undefined" ||
		type === "symbol"
	) {
		throw new Error("");
	}
	return type;
}

export function isJSONValueOfType<TTypeName extends keyof Types>(
	value: JSONValue,
	expectedTypeName: TTypeName
): value is Types[TTypeName] {
	return getType(value) == expectedTypeName;
}
