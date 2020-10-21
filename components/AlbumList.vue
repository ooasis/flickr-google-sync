<template>
  <div>
    <v-data-table
      v-model="selectedAlbum"
      :headers="headers"
      :items="albums"
      :items-per-page="5"
      item-key="id"
      show-select
      :single-select="singleSelect"
      class="elevation-1"
      @item-selected="onSelectedAlbum"
    >
    </v-data-table>
  </div>
</template>

<script>
export default {
  props: {
    onSelectedAlbum: {
      type: Function,
      required: true,
    },
    albums: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      singleSelect: true,
      selectedAlbum: [],
      headers: [
        {
          text: 'Name',
          align: 'start',
          sortable: false,
          value: 'title',
        },
        { text: 'Count', value: 'photos' },
        { text: 'Description', value: 'description' },
      ],
    }
  },
}
</script>
