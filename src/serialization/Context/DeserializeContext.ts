import { Namespace } from "../..";

export class DeserializeContext {
	static readonly Default = new DeserializeContext(undefined);

	constructor(public readonly parent: DeserializeContext | undefined) {}

	public readonly namespaces = new Map<string, Namespace>();

	public lookupNamespace(prefix: string): Namespace {
		const result = this.namespaces.get(prefix);
		if (result) {
			return result;
		}
		if (this.parent) {
			return this.parent.lookupNamespace(prefix);
		}
		throw new Error(`Prefix "${prefix}" is not defined.`);
	}
}
