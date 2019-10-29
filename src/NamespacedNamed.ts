export class NamespacedName {
	constructor(
		public readonly namespace: string,
		public readonly name: string
	) {}

	public equals(other: NamespacedName): boolean {
		return this.namespace === other.namespace && this.name === other.name;
	}

	public toString() {
		return `${this.namespace}#${this.name}`;
	}
}

export interface Namespace {
	(val: string): NamespacedName;
	namespace: string;
}

export function namespace(namespace: string): Namespace {
	const f = (name: string): NamespacedName => {
		return new NamespacedName(namespace, name);
	};
	f.namespace = namespace;
	return f;
}
