import { SolarySystem } from './schemas'

export function create_system_graph(systems: SolarySystem[]) {
  const graph = new Map<number, SolarySystem>()

  systems.forEach((system) => {
    system.stargates.forEach((stargate) => {
      graph.set(stargate.id, system)
    })
  })

  return {
    get(id: number) {
      return graph.get(id)
    },
  }
}
