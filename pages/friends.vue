<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col sm="9" md="7" lg="5" xl="3">
        <v-data-table
          class="text-center"
          mobile-breakpoint="0"
          disable-sort
          no-data-text="You don't have any friends yet!"
          no-results-text="Could not find the friend you are looking for."
          :headers="headers"
          :items="friends"
        >
          <template #item.add="{ item }">
            <v-icon
              small
              @click="openInNewTab(`https://discord.com/users/${item.id}`)"
              v-text="icons.accountPlus"
            />
          </template>
          <template #item.delete="{ item }">
            <v-icon small @click="promptRemove(item)" v-text="icons.delete" />
            <v-dialog v-model="showFriendRemovePrompt" width="500">
              <v-card class="text-center">
                <v-card-title class="text-center">
                  Are you sure you want to unfriend
                  {{ removingFriend.username }}?
                </v-card-title>
                <v-divider />
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    color="red darken-3"
                    @click="showFriendRemovePrompt = false"
                    v-text="'Cancel'"
                  />
                  <v-btn
                    color="green darken-2"
                    @click="removeFriend(removingFriend.id)"
                    v-text="'Unfriend'"
                  />
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
import { mdiAccountPlus, mdiDelete } from '@mdi/js'
import Vue from 'vue'

export default Vue.extend({
  middleware: ['auth'],
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
          value: 'add',
          align: 'center',
          class: 'orange darken-2',
          width: 1,
          divider: true,
        },
        {
          text: ' ',
          value: 'delete',
          align: 'center',
          class: 'orange darken-2',
          width: 1,
        },
      ],
      showFriendRemovePrompt: false,
      removingFriend: {},
      icons: {
        delete: mdiDelete,
        accountPlus: mdiAccountPlus,
      },
    }
  },
  watch: {
    showFriendRemovePrompt(newVal) {
      if (!newVal) this.removingFriend = {}
    },
  },
  async mounted() {
    const {
      data: {
        data: { getFriends },
      },
    } = await this.$axios({
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

    if (getFriends) this.friends = getFriends.friends
  },
  methods: {
    promptRemove(friend: any) {
      this.removingFriend = friend
      this.showFriendRemovePrompt = true
    },
    openInNewTab(link: string) {
      window.open(link, '_blank')
    },
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
          variables: { userID: this.$auth.user.id, friendID },
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
