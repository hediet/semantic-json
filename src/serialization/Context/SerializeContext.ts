import { Namespace } from "../..";

export class SerializeContext {
	static get Default() {
		return new DefaultSerializeContextImpl();
	}

	public static isDefault(s: SerializeContext) {
		return s instanceof DefaultSerializeContextImpl;
	}

	private key = 1;
	public readonly namespaces = new Map<string, string>();

	public getPrefixForNamespace(ns: Namespace): string {
		let prefix = this.namespaces.get(ns.namespace);
		if (!prefix) {
			prefix = `p${this.key++}`;
			this.namespaces.set(ns.namespace, prefix);
		}
		return prefix;
	}
}

class DefaultSerializeContextImpl extends SerializeContext {
	public getPrefixForNamespace(ns: Namespace): string {
		throw new Error("Not in object context!");
	}
}
