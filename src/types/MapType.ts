import { TypeDef, MapTypeDef } from "../schema/typeDefs";
import { BaseType } from "./BaseType";
import { Type } from "./types";

export class MapType extends BaseType<any> {
	public readonly kind = "map";

	constructor(public readonly valueType: Type) {
		super();
	}

	public toTypeDef(): TypeDef {
		return new MapTypeDef(this.valueType.toTypeDef());
	}
}
