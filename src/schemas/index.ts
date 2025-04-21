import * as z from '@zod/mini'

const PointSchema = z.tuple([z.number(), z.number(), z.number()])

export const StargateSchema = z.interface({
  id: z.number(),
  destination: z.number(),
  position: PointSchema,
})

export const SolarSystemSchema = z.interface({
  solarSystemID: z.number(),
  center: PointSchema,
  security: z.number(),
  stargates: z.array(StargateSchema),
})

export const RegionSchema = z.interface({
  center: PointSchema,
  name: z.string(),
})

export type Point = z.infer<typeof PointSchema>
export type SolarySystem = z.infer<typeof SolarSystemSchema>
export type Stargate = z.infer<typeof StargateSchema>
export type Region = z.infer<typeof RegionSchema>
