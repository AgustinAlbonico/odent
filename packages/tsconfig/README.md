# @sistema-odontologico/tsconfig

Presets canónicos de TypeScript para el monorepo.

## Presets disponibles

- `@sistema-odontologico/tsconfig/base`
- `@sistema-odontologico/tsconfig/nextjs`
- `@sistema-odontologico/tsconfig/nestjs`

## Uso

### Packages shared

```json
{
  "extends": "@sistema-odontologico/tsconfig/base"
}
```

### Next.js app

```json
{
  "extends": "@sistema-odontologico/tsconfig/nextjs"
}
```

### NestJS app

```json
{
  "extends": "@sistema-odontologico/tsconfig/nestjs"
}
```
