import { NamespacedName, Namespace, namespace } from "../NamespacedNamed";
import { JSONValue } from "../JSONValue";
import {
	TypePackageDef,
	TypeDef,
	ArrayTypeDef,
	MapTypeDef,
	ObjectTypeDef,
	ObjectPropertyDef,
	StringTypeDef,
	NumberTypeDef,
	BooleanTypeDef,
	IntersectionTypeDef,
	UnionTypeDef,
	TypeRefDef,
} from "./typeDefs";

export class TypeSystem {
	private readonly knownTypes = new Map<string, TypeDefinition>();

	public getType(name: NamespacedName): TypeDefinition {
		let k = this.knownTypes.get(name.toString());
		if (!k) {
			k = new TypeDefinition(name, undefined);
			this.knownTypes.set(name.toString(), k);
		}
		return k;
	}

	public isTypeDefined(name: NamespacedName): boolean {
		return this.getType(name).isDefined;
	}

	public defineType(name: NamespacedName, definition: Type) {
		this.getType(name).updateDefinition(definition);
	}

	public definedNamespaces(): Namespace[] {
		const namespaces = new Set<string>();
		for (const t of this.knownTypes.values()) {
			namespaces.add(t.namespacedName.namespace);
		}
		return [...namespaces].map(ns => namespace(ns));
	}

	public toPackage(ns: Namespace): TypePackageDef {
		const definitions: Record<string, TypeDef> = {};
		for (const type of this.knownTypes.values()) {
			if (type.namespacedName.namespace === ns.namespace) {
				definitions[
					type.namespacedName.name
				] = type.definition.toTypeDef();
			}
		}
		const result = new TypePackageDef(ns, definitions);
		return result;
	}
}

export type Type =
	| TypeDefinition
	| UnionType
	| IntersectionType
	| StringType
	| BooleanType
	| NumberType
	| ObjectType
	| ArrayType
	| CustomType
	| MapType;

export abstract class BaseType {
	public abstract toTypeDef(): TypeDef;
}

export class TypeDefinition extends BaseType {
	private _definition: Type | undefined;

	public get isDefined(): boolean {
		return !!this._definition;
	}

	public get definition(): Type {
		if (!this._definition) {
			throw new Error("no definition");
		}
		return this._definition;
	}

	public updateDefinition(newDefinition: Type) {
		this._definition = newDefinition;
	}

	constructor(
		public readonly namespacedName: NamespacedName,
		definition: Type | undefined
	) {
		super();

		this._definition = definition;
	}

	public toTypeDef(): TypeDef {
		return new TypeRefDef(this.namespacedName);
	}
}

export class CustomType extends BaseType {
	constructor(public readonly type: NamespacedName) {
		super();
	}

	public toTypeDef(): TypeDef {
		throw new Error("Not implemneted");
	}
}

export class UnionType extends BaseType {
	public readonly kind = "union";
	constructor(public readonly of: Type[]) {
		super();
	}

	public toTypeDef(): TypeDef {
		return new UnionTypeDef(this.of.map(t => t.toTypeDef()));
	}
}

export class IntersectionType extends BaseType {
	public readonly kind = "intersection";
	constructor(public readonly of: Type[]) {
		super();
	}

	public toTypeDef(): TypeDef {
		return new IntersectionTypeDef(this.of.map(t => t.toTypeDef()));
	}
}

export class StringType extends BaseType {
	public readonly kind = "string";

	public toTypeDef(): TypeDef {
		return new StringTypeDef();
	}
}

export class NumberType extends BaseType {
	public readonly kind = "number";

	public toTypeDef(): TypeDef {
		return new NumberTypeDef();
	}
}

export class BooleanType extends BaseType {
	public readonly kind = "boolean";

	public toTypeDef(): TypeDef {
		return new BooleanTypeDef();
	}
}

export class ObjectType extends BaseType {
	public readonly kind = "object";

	constructor(public readonly properties: Record<string, ObjectProperty>) {
		super();
	}

	public toTypeDef(): TypeDef {
		return new ObjectTypeDef(
			Object.fromEntries(
				Object.entries(this.properties).map(([name, prop]) => [
					name,
					new ObjectPropertyDef(
						prop.type.toTypeDef(),
						prop.optional,
						prop.defaultValue
					),
				])
			)
		);
	}
}

export class ObjectProperty {
	constructor(
		public readonly name: string,
		public readonly type: Type,
		public readonly optional: boolean,
		public readonly defaultValue: JSONValue | undefined
	) {}
}

export class MapType extends BaseType {
	public readonly kind = "map";

	constructor(public readonly valueType: Type) {
		super();
	}

	public toTypeDef(): TypeDef {
		return new MapTypeDef(this.valueType.toTypeDef());
	}
}

export class ArrayType extends BaseType {
	public readonly kind = "array";

	constructor(public readonly itemType: Type) {
		super();
	}

	public toTypeDef(): TypeDef {
		return new ArrayTypeDef(this.itemType.toTypeDef());
	}
}
