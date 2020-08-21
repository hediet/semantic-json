import { Namespace } from "../NamespacedNamed";

export class DeserializeContext {
	public static default = new DeserializeContext(undefined, true, true);

	private readonly namespaces = new Map<string, Namespace>();

	private constructor(
		public readonly parent: DeserializeContext | undefined,
		public readonly firstDeserializationOnValue: boolean,
		public readonly reportUnexpectedPropertiesAsError: boolean
	) {}

	public hasPrefixes(): boolean {
		return this.namespaces.size > 0;
	}

	public withPrefixes(
		prefixes: Record<string, Namespace>
	): DeserializeContext {
		const c = new DeserializeContext(
			this,
			this.firstDeserializationOnValue,
			this.reportUnexpectedPropertiesAsError
		);
		for (const [prefix, ns] of Object.entries(prefixes)) {
			c.namespaces.set(prefix, ns);
		}
		return c;
	}

	private _withReportUnexpectedPropertiesAsError(
		val: boolean
	): DeserializeContext {
		if (this.reportUnexpectedPropertiesAsError === val) {
			return this;
		}
		return new DeserializeContext(
			this,
			this.firstDeserializationOnValue,
			val
		);
	}

	public withoutReportUnexpectedPropertiesAsError(): DeserializeContext {
		return this._withReportUnexpectedPropertiesAsError(true);
	}

	private _withFirstDeserializationOnValue(val: boolean): DeserializeContext {
		if (this.firstDeserializationOnValue === val) {
			return this;
		}
		return new DeserializeContext(
			this,
			val,
			this.reportUnexpectedPropertiesAsError
		);
	}

	public withFirstDeserializationOnValue(): DeserializeContext {
		return this._withFirstDeserializationOnValue(true);
	}

	public withoutFirstDeserializationOnValue(): DeserializeContext {
		return this._withFirstDeserializationOnValue(false);
	}

	public lookupNamespace(prefix: string): Namespace | undefined {
		const result = this.namespaces.get(prefix);
		if (result) {
			return result;
		}
		if (this.parent) {
			return this.parent.lookupNamespace(prefix);
		}
		return undefined;
	}
}
