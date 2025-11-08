<template>
    <div  class="col">
                <div class="card h-100" style="border: 1px solid #aa50e7">
                  <div class="card-header bg-dark text-white text-uppercase small">
                    {{ column.name }}
                  </div>
                  <div class="card-body rounded-bottom-1" style="background-color: #303236">
                    <draggable
                      v-model="issuesByColumn[column.name]"
                      :group="groups"
                      item-key="id"
                      animation="200"
                      ghost-class="ghost"
                      chosen-class="chosen"
                      @end="onDragEnd"
                      class="dropzone"
                      :scroll="scrollContainer"
                      :scrollSensitivity="100"
                      :scrollSpeed="15"
                    >
                      <template #item="{ element }">
                        <div
                          class="issuebox mb-2 p-2 rounded "
                          :data-item-id="element.id"
                          @click="openIssue(element)"
                        >
                          <div class="issuetitle"
                            >
                            <strong>{{ element.title }}</strong>
                          </div>
                          <div class="issuebody small">{{ element.body }}</div>
                        </div>
                      </template>
                    </draggable>
                  </div>
                </div>
              </div>
</template>

<script setup>

import draggable from 'vuedraggable'

const props = defineProps({
  column: Object,
  issuesByColumn: Object,
  scrollContainer: Object,
  groups: Object,
  onDragEnd: Function,
  openIssue: Function
})
</script>

<style scoped>
.dropzone {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
}

.issuebox {
  background-color: #3b3e42;
  color: white;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
}
.issuebox:hover {
  background-color: #50545b;
}
.chosen {
  background-color: #aa50e7 !important;
  transform: scale(1.05);
}
.ghost {
  opacity: 1;
}
.issuebody {
  margin-top: 5px;
  font-size: 14px;
  color: #d1d1d1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word;
}
</style>