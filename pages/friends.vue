<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="5">
        <v-data-table
          class="text-center"
          disable-sort
          no-data-text="You don't have any friends yet!"
          no-results-text="Could not find the friend you are looking for."
          :headers="headers"
          :items="friends"
        >
          <template #item.actions="{ item }">
            <v-icon small @click="showFriendRemovePrompt = true">
              mdi-delete
            </v-icon>
            <v-dialog v-model="showFriendRemovePrompt" width="500">
              <v-card class="text-center">
                <v-card-title class="text-center">
                  Are you sure you want to unfriend {{ item.username }}?
                </v-card-title>
                <v-divider />
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="red darken-3"
                    @click="showFriendRemovePrompt = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn color="green darken-2" @click="removeFriend(item.id)">
                    Unfriend
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
      friends: [],
      headers: [
        {
          text: 'Usernames',
          value: 'username',
          align: 'center',
          class: 'orange darken-2',
          divider: true,
        },
        {
          text: ' ',
          value: 'actions',
          align: 'center',
          class: 'orange darken-2',
          width: 1,
        },
      ],
      showFriendRemovePrompt: false,
    }
  },
  async mounted() {
    const { data: friends } = await this.$axios({
      method: 'post',
      url: `${process.env.WEBSITE_URL}/graphql`,
      data: {
        query:
          'query Friend($userID: String!) { \
            getFriends(userID: $userID) { \
              friends { \
                id \
                username \
              } \
            } \
          }',
        variables: { userID: this.$auth.user.id },
      },
      headers: { 'Content-Type': 'application/json' },
    })

    if (friends.data.getFriends) this.friends = friends.data.getFriends.friends
  },
  methods: {
    async removeFriend(friendID: string) {
      this.showFriendRemovePrompt = false

      await this.$axios({
        method: 'post',
        url: `${process.env.WEBSITE_URL}/graphql`,
        data: {
          query:
            'mutation Friend($userID: String! $friendID: String!) { \
              removeFriend(userID: $userID friendID: $friendID) \
            }',
          variables: { userID: this.$auth.user.id, friendID: friendID },
        },
        headers: { 'Content-Type': 'application/json' },
      })

      const index = this.friends.findIndex(
        (friend: any) => friend.id === friendID
      )

      if (index > -1) this.friends.splice(index, 1)
    },
  },
})
</script>
