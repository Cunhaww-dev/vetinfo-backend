// Either é usado para fazermos tratamento de erros sem usar o Try Catch, ele é um tipo que pode ser Left ou Right, onde Left é o erro e Right é o valor correto.
// Ele é usado para evitar que o código quebre e para facilitar o tratamento de erros.

export class Left<L, R> {
  constructor(readonly value: L) {}

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }
}

export class Right<L, R> {
  constructor(readonly value: R) {}

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(value: L): Either<L, R> => new Left(value);
export const right = <L, R>(value: R): Either<L, R> => new Right(value);

// O Either precisa de dois parâmetros porque ele substitui o try/catch. O parâmetro L (Left) guarda e indica o erro, enquanto o R (Right) indica o sucesso
// Posteriormente podemos passar isso para nossos controllers sem expor Http, então o domínio não conhece HTTP, e o controller é quem vai decidir o que fazer com isso, se vai retornar 200 ou 400, por exemplo. 