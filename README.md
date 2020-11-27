# Semantic Json

A library for reflectable runtime validation of json values.
A mix of io-ts and JSON Schema.
This library is still in its early development. The API is not yet final.

## Features

## Installation

```
yarn add @hediet/semantic-json
```

## Basic Usage

The most important concept of this library is the serializer.
A serializer can deserialize JSON to a typed value and serialize the value back to JSON.
All functions to construct serializers start with an `s`.

Serializers can be composed, as the following example demonstrates:

```ts
// All serializers start with an `s`.
import {
	sObject,
	sString,
	sArrayOf,
	optionalProp,
} from "@hediet/semantic-json";
import { expect } from "chai";

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
```

##

## Generating TypeScript Declaration Types

To generate typescript declaration types, it is recommended to name the serializers.
The `TypeScriptTypeGenerator` will be moved to its own package at some later point.

```ts
import {
	sObject,
	sString,
	sArrayOf,
	namespace,
	TypeScriptTypeGenerator,
} from "@hediet/semantic-json";

const myNs = namespace("demo.org");

class Contact {
	constructor(private firstName: string, private lastName: string) {}

	public toString() {
		return `${this.firstName} ${this.lastName}`;
	}
}

const contact = sObject({
	firstName: sString(),
	lastName: sString(),
});

const contactBook = sArrayOf(contact.defineAs(myNs("Contact"))).defineAs(
	myNs("ContactBook")
);

const g = new TypeScriptTypeGenerator();
const tsType = g.getType(contactBook);
equal(tsType, "ContactBook");
equal(
	g.getDefinitionSource(),
	`type ContactBook = (Contact)[];

type Contact = {
    firstName: string;
    lastName: string;
    /**
     * The city where the contact lives in.
     */
    city?: string;
};`
);
```
