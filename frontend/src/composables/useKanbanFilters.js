import { ref, computed } from 'vue'

export function useKanbanFilters(repoData, issuesByColumn) {
  const milestoneSearch = ref('')
  const labelSearch = ref('')

  const selectedMilestones = ref([])
  const selectedLabels = ref([])

  const filteredDropdownMilestones = computed(() => {
    const q = milestoneSearch.value.toLowerCase()
    return (repoData.value.milestones || []).filter(m => m.title.toLowerCase().includes(q))
  })

  const filteredDropdownLabels = computed(() => {
    const q = labelSearch.value.toLowerCase()
    return (repoData.value.labels || []).filter(l => l.name.toLowerCase().includes(q))
  })

  function toggleMilestoneFilter(milestone) {
    const index = selectedMilestones.value.findIndex(m => m.id === milestone.id)
    if (index !== -1) selectedMilestones.value.splice(index, 1)
    else selectedMilestones.value.push(milestone)
  }

  function toggleLabelFilter(label) {
    const index = selectedLabels.value.findIndex(l => l.id === label.id)
    if (index !== -1) selectedLabels.value.splice(index, 1)
    else selectedLabels.value.push(label)
  }

  const filteredIssuesByColumn = computed(() => {
    const hasMilestoneFilter = selectedMilestones.value.length > 0
    const hasLabelFilter = selectedLabels.value.length > 0

    if (!hasMilestoneFilter && !hasLabelFilter) {
      return issuesByColumn.value
    }

    const result = {}
    
    Object.keys(issuesByColumn.value).forEach(colKey => {
      const issues = issuesByColumn.value[colKey]
      
      result[colKey] = issues.filter(issue => {
        const matchesMilestone = !hasMilestoneFilter || (
          issue.milestone && selectedMilestones.value.some(m => m.id === issue.milestone.id)
        )
        const matchesLabel = !hasLabelFilter || (
          issue.labels && 
          issue.labels.some(issueLabel => selectedLabels.value.some(sel => sel.id === issueLabel.id))
        )
        return matchesMilestone && matchesLabel
      })
    })

    return result
  })

  return {
    milestoneSearch,
    labelSearch,
    selectedMilestones,
    selectedLabels,
    filteredDropdownMilestones,
    filteredDropdownLabels,
    toggleMilestoneFilter,
    toggleLabelFilter,
    filteredIssuesByColumn
  }
}