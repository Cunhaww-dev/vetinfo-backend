export interface HashProvider {
   hash(plain: string): Promise<string>;
   compare(plain: string, hashed: string): Promise<boolean>;
}

// Dominio declara o que precisa, infra entrega