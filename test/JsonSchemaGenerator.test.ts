import {
	TypeScriptTypeGenerator,
	Serializer,
	sLazy,
	sOpenObject,
	sArrayOf,
	sString,
	sOptionalProp,
	sUnion,
	sLiteral,
	sBoolean,
} from "../src";
import { namespace } from "../src/NamespacedNamed";
import { JsonSchemaGenerator } from "../src/json-schema/JsonSchemaGenerator";
import { deepEqual, deepStrictEqual } from "assert";

describe("JsonSchemaGenerator", () => {
	it("works", () => {
		const g = new JsonSchemaGenerator();

		const sTreeNode: Serializer<any> = sLazy(() =>
			sOpenObject({
				children: sArrayOf(sTreeNode),
				items: sArrayOf(
					sOpenObject({
						text: sString(),
						emphasis: sOptionalProp(
							sUnion([
								sLiteral("style1"),
								sLiteral("style2"),
								sLiteral("style3"),
								sString(),
							]),
							{}
						),
					})
				),
				segment: sOptionalProp(sString(), {}),
				isMarked: sOptionalProp(sBoolean(), {}),
			}).defineAs(namespace("hediet.de/visualization")("node"))
		);

		const sTree = sOpenObject({
			kind: sOpenObject({
				tree: sLiteral(true),
			}),
			root: sTreeNode,
		});

		//console.log(JSON.stringify(g.getJsonSchemaWithDefinitions(sTree)));
		deepStrictEqual(g.getJsonSchemaWithDefinitions(sTree), {
			definitions: {
				node: {
					type: "object",
					properties: {
						children: {
							type: "array",
							items: { $ref: "#/definitions/node" },
						},
						items: {
							type: "array",
							items: {
								type: "object",
								properties: {
									text: { type: "string" },
									emphasis: {
										oneOf: [
											{ enum: ["style1"] },
											{ enum: ["style2"] },
											{ enum: ["style3"] },
											{ type: "string" },
										],
									},
								},
								required: ["text"],
							},
						},
						segment: { type: "string" },
						isMarked: { type: "boolean" },
					},
					required: ["children", "items"],
				},
			},
			type: "object",
			properties: {
				kind: {
					type: "object",
					properties: { tree: { enum: [true] } },
					required: ["tree"],
				},
				root: { $ref: "#/definitions/node" },
			},
			required: ["kind", "root"],
		});
	});
});
