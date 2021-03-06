export class DeserializeResult<T> {
	static fromValue<T>(value: T): DeserializeResult<T> {
		return new DeserializeResult(true, value, [], undefined);
	}

	public static fromError(
		...errorLike: DeserializeErrorLike[]
	): DeserializeResult<any> {
		return new DeserializeResult(
			false,
			undefined,
			errorLike.map((e) => DeserializeError.from(e)),
			undefined
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
			undefined
		);
	}

	public readonly value: T = undefined!;

	constructor(
		public readonly hasValue: boolean,
		value: T | undefined,
		public readonly errors: readonly DeserializeError[],
		public readonly unprocessedPropertyTree:
			| UnexpectedPropertyTree
			| undefined
	) {
		this.value = value!;
	}

	public get hasErrors(): boolean {
		return this.errors.length > 0;
	}

	public formatError(): string {
		return JSON.stringify(this.errors); // TODO
	}

	public getValidValue(): T {
		if (this.hasErrors) {
			throw new Error(this.formatError());
		}
		return this.value;
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

	public addError(...errors: DeserializeErrorLike[]): void {
		this.errors.push(...errors.map((e) => DeserializeError.from(e)));
	}

	public build(): DeserializeResult<T> {
		return new DeserializeResult(
			this.hasValue,
			this.value,
			this.errors,
			undefined
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

export class UnexpectedPropertyTree {
	constructor(
		public readonly properties: Record<string, UnexpectedPropertyTree>,
		public readonly unprocessedProperties: Set<string>
	) {}

	public merge(
		other: UnexpectedPropertyTree
	): UnexpectedPropertyTree | undefined {
		// TODO
		return undefined;
	}
}
