import { ObjectSerializerImpl } from "./serializers";

export class DeserializeResult<T> {
	static fromValue<T>(value: T): DeserializeResult<T> {
		return new DeserializeResult(true, value, [], []);
	}

	public static fromError(
		...errorLike: DeserializeErrorLike[]
	): DeserializeResult<any> {
		return new DeserializeResult(
			false,
			undefined,
			errorLike.map((e) => DeserializeError.from(e)),
			[]
		);
	}

	public static fromValueWithError<T>(
		value: T,
		...errorLike: DeserializeErrorLike[]
	): DeserializeResult<T> {
		return new DeserializeResult(
			true,
			value,
			errorLike.map((e) => DeserializeError.from(e)),
			[]
		);
	}

	public readonly value: T = undefined!;

	constructor(
		public readonly hasValue: boolean,
		value: T | undefined,
		public readonly errors: readonly DeserializeError[],
		public readonly participatedClosedObjects: ObjectSerializerImpl<any>[]
	) {
		this.value = value!;
	}

	public get hasErrors(): boolean {
		return this.errors.length > 0;
	}

	public formatError(): string {
		return JSON.stringify(this.errors); // TODO
	}
}

export class DeserializeResultBuilder<T> {
	private hasValue = false;
	private value: T | undefined = undefined;
	private readonly errors = new Array<DeserializeError>();

	public setValue(value: T): void {
		this.hasValue = true;
		this.value = value;
	}

	public readonly participatedClosedObjects = new Array<
		ObjectSerializerImpl<any>
	>();
	public addParticipatedClosedObjects(
		objects: ObjectSerializerImpl<any>[]
	): void {
		this.participatedClosedObjects.push(...objects);
	}

	public addError(...errors: DeserializeErrorLike[]): void {
		this.errors.push(...errors.map((e) => DeserializeError.from(e)));
	}

	public build(): DeserializeResult<T> {
		return new DeserializeResult(
			this.hasValue,
			this.value,
			this.errors,
			this.participatedClosedObjects
		);
	}
}

type DeserializeErrorLike =
	| {
			message: string;
			path?: (string | number)[];
			alternatives?: DeserializeErrorAlternative[];
	  }
	| DeserializeError;

export class DeserializeError {
	public static from(error: DeserializeErrorLike) {
		return new DeserializeError(
			error.message,
			error.path === undefined ? [] : error.path,
			error.alternatives || []
		);
	}
	constructor(
		public readonly message: string,
		public readonly path: readonly (string | number)[],
		public readonly alternatives: readonly DeserializeErrorAlternative[]
	) {}

	public prependPath(path: string | number): DeserializeError {
		return new DeserializeError(
			this.message,
			[path].concat(...this.path),
			this.alternatives
		);
	}
}

export interface DeserializeErrorAlternative {
	alternativeId: string;
	errors: readonly DeserializeError[];
}
