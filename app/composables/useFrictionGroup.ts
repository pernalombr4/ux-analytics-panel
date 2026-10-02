// Which friction group the page is looking at, kept in the URL (?group=).
export function useFrictionGroup() {
  const route = useRoute()
  const router = useRouter()
  const group = computed<FrictionKey>({
    get: () => {
      const wanted = String(route.query.group ?? '')
      return (FRICTION_GROUPS.find(g => g.key === wanted)?.key ?? 'DeadClickCount')
    },
    set: value => router.replace({ query: { ...route.query, group: value } })
  })
  const items = FRICTION_GROUPS.map(g => ({ label: g.label, value: g.key }))
  return { group, items, label: computed(() => frictionLabel(group.value)) }
}
