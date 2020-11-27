// All serializers start with an `s`.
import {
	sObject,
	sString,
	sArrayOf,
	optionalProp,
} from "@hediet/semantic-json";
import { expect } from "chai";

const x = sString();

const contactBook = sArrayOf(
	sObject({
		firstName: sString(),
		lastName: sString(),
		city: optionalProp(sString(), {
			description: "The city where the contact lives in.",
		}),
	}),
	{ minLength: 1 }
);

expect(() => {
	const value = contactBook
		.deserialize([{ firstName: "Test" }])
		// getValidValue throws and complains that "lastName" is missing.
		.getValidValue();
	// value is of type { firstName: string, lastName: string, city?: string }[]
	console.log(value[0].firstName, value[0].lastName);
}).to.throw();
