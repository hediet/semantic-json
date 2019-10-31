import {
	sObject,
	field,
	DowncastSerializer,
	sBoolean,
	sString,
	Serializer,
	JSONObject,
	sArray,
	namespace,
} from "../src";
import { sTypePackage } from "../src/schema/typeDefsSerializer";
import { TypeSystem } from "../src/schema/types";
import { deserializationValue } from "../src/result";

describe("Serialization Schema", () => {
	it("works", () => {
		debugger;
		class ContactBook {
			public contacts = new Array<Contact>();
		}

		class Contact {
			public firstName: string = "";
			public lastName: string = "";

			public get name(): string {
				return this.firstName + " " + this.lastName;
			}
		}

		const contactBookNs = namespace("types.hediet.de/contactbook");

		const sContact = sObject({
			properties: {
				firstName: sString,
				lastName: sString,
			},
		})
			.refine<Contact>({
				canSerialize: (v): v is Contact => v instanceof Contact,
				deserialize: v => {
					const c = new Contact();
					c.firstName = v.firstName;
					c.lastName = v.lastName;
					return deserializationValue(c);
				},
				serialize: v => ({
					firstName: v.firstName,
					lastName: v.lastName,
				}),
			})
			.defineAs(contactBookNs("Contact"));

		const sContactBook = sObject({
			properties: {
				contacts: field({ serializer: sArray(sContact) }),
			},
		})
			.refine<ContactBook>({
				canSerialize: (v): v is ContactBook => v instanceof ContactBook,
				deserialize: v => {
					const c = new ContactBook();
					c.contacts = v.contacts;
					return deserializationValue(c);
				},
				serialize: v => ({ contacts: v.contacts }),
			})
			.defineAs(contactBookNs("ContactBook"));

		const r = sContactBook
			.deserializeTyped({
				...{
					$ns: { t: contactBookNs.namespace },
					$type: "t#ContactBook",
				},
				contacts: [
					{
						...{ $type: "t#Contact" },
						firstName: "John",
						lastName: "Doe",
					},
				],
			})
			.unwrap();

		const ts = new TypeSystem();
		const t = sContactBook.getType(ts);

		for (const ns of ts.definedNamespaces()) {
			const pkg = ts.toPackage(ns);
			const j = sTypePackage.serialize(pkg);

			const t = sTypePackage.deserialize(j).unwrap();

			const ts2 = new TypeSystem();
			t.addToTypeSystem(ts2);

			debugger;
		}

		if (r.contacts[0].name !== "John Doe") {
			throw new Error();
		}
	});

	it("test2", () => {
		const r = sTypePackage.deserialize({
			$ns: {
				t: "json-types.org/basic-types",
				td: "json-types.org/type-definition",
				bla: "demo.org/bla",
			},
			$type: "td#TypeDefinitions",
			packageId: "bla",
			typeDefinitions: {
				ContactBook: {
					kind: "object",
					properties: {
						contacts: {
							type: { kind: "array", of: "bla#Contact" },
						},
					},
				},
				Contact: {
					kind: "object",
					properties: {
						firstName: { type: { kind: "string" } },
						lastName: { type: { kind: "string" } },
					},
				},
			},
		});

		/*if (r.kind === "successful") {
			const res = r.result;
			const usedNs = res.getUsedNamespaces();

			const ts = new TypeSystem();
			res.addToTypeSystem(ts);

			debugger;
		}*/
	});
});

describe("Serialization", () => {
	it("works", () => {
		/*
		class Foo {
			constructor(
				public readonly x: string,
				public readonly y?: boolean
			) {}
		}

		interface Test {
			getSerializerForType(
				namespace: string,
				name: string
			): Serializer<any, JSONObject>;
			getSerializerForInstance(obj: any): Serializer<any, JSONObject>;
		}

		const t = sObject({
			properties: {
				x: sString,
				y: field({
					serializer: sBoolean,
					optional: { withDefault: true },
				}),
			},
		}).refine<Foo>({
			canSerialize: (item): item is Foo => item instanceof Foo,
			deserialize: item => ({
				kind: "successful",
				result: new Foo(item.x, item.y),
			}),
			serialize: item => ({ x: item.x, y: item.y || true }),
		});

		const r = t.deserializeTyped({ x: "test" });

		if (r.kind === "successful") {
			const obj = r.result;
			obj;
		}*/
	});
});
