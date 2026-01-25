<template>
  <Teleport to="body">
    <div v-if="activeMenu" class="dropdown-menu-custom popup" :style="menuStyle" @click.stop>
      
      <template v-if="activeMenu.startsWith('repo-')">
        <div class="dropdown-item-custom" @mouseenter="$emit('openPicker', $event)">
          Add to group/org
          <i class="bi bi-chevron-right float-end" style="font-size: 12px; margin-top: 4px;"></i>
        </div>
      </template>

      <template v-else>
        <div class="dropdown-item-custom" @mouseenter="$emit('openPicker', $event)">
           Add to other...
           <i class="bi bi-chevron-right float-end" style="font-size: 12px; margin-top: 4px;"></i>
        </div>

        <div
          class="dropdown-item-custom text-danger"
          @click="$emit('deleteFromContext')"
          @mouseenter="$emit('closePicker')"
        >
          Remove form list
        </div>
      </template>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="activePicker"
      class="group-picker-menu popup"
      :style="pickerStyle"
      @mouseenter="$emit('keepPickerOpen')"
      @mouseleave="$emit('closePicker')"
      @click.stop
    >
      <h6 class="text-muted text-uppercase mb-2 mt-1 px-2" style="font-size: 0.7rem;">Organizations</h6>
      <ul class="list-group mb-2">
        <li
          v-for="org in orgsList"
          :key="org._id"
          class="list-group-item list-group-item-action text-white"
          @click="$emit('pickerSelect', { id: org._id, type: 'org' })"
        >
          <i class="bi bi-building me-2"></i> {{ org.name }}
        </li>
        <li v-if="!orgsList || orgsList.length === 0" class="text-white-50 px-2 small">No organizations</li>
      </ul>

      <h6 class="text-muted text-uppercase mb-2 px-2" style="font-size: 0.7rem;">Groups</h6>
      <ul class="list-group">
        <li
          v-for="g in groupsList"
          :key="g._id"
          class="list-group-item list-group-item-action text-white"
          @click="$emit('pickerSelect', { id: g._id, type: 'group' })"
        >
          <i class="bi bi-folder me-2"></i> {{ g.name }}
        </li>
        <li v-if="!groupsList || groupsList.length === 0" class="text-white-50 px-2 small">No groups</li>
      </ul>

    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  activeMenu: String,
  menuStyle: Object,
  activePicker: String,
  pickerStyle: Object,
  groupsList: Array,
  orgsList: Array // <--- Dodano prop
})

defineEmits([
  'openPicker',
  'closePicker',
  'keepPickerOpen',
  'deleteFromContext', // Zmieniona nazwa z deleteFromGroup
  'pickerSelect'
])
</script>

<style scoped>
.popup { position: fixed !important; z-index: 9999; }

.dropdown-menu-custom {
  background: #222; border: 1px solid #444; padding: 6px; border-radius: 6px; width: 160px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.dropdown-item-custom { 
  padding: 8px 10px; color: #ccc; cursor: pointer; border-radius: 4px; font-size: 0.9rem;
  display: flex; justify-content: space-between; align-items: center;
}
.dropdown-item-custom:hover { background: #aa50e7; color: white; }
.dropdown-item-custom.text-danger:hover { background: #dc3545; color: white !important; }

.group-picker-menu {
  background: #1e1e1e; border: 1px solid #444; padding: 10px 0; border-radius: 6px;
  width: 220px; max-height: 300px; overflow-y: auto; scrollbar-color: #303236 #1d1e20;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.list-group-item { 
  background: transparent; border: none; cursor: pointer; padding: 6px 12px; font-size: 0.9rem;
}
.list-group-item:hover { background: #aa50e7 !important; color: white !important; }
</style>