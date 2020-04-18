import { BaseSerializer } from "./BaseSerializer";
import { Serializer } from "../Serializer";
import { sString, sNumber } from "./TypeSerializer";

/*
export function sTuple(): TupleSerializer<{}> {}
class TupleSerializer<TItems> extends BaseSerializer<TItems, any[]> {
	public addItem<
		TItemName extends string,
		TSerializer extends Serializer<any>
	>(
		name: TItemName,
		serializer: TSerializer
	): TupleSerializer<
		TItems & { [TName in TItemName]: TSerializer["TValue"] }
	> {}
}

sTuple()
	.addItem("test", sString)
	.addItem("foo", sNumber)
	.deserialize(["foo", 10])
	.unwrap();
*/
