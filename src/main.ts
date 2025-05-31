import { App, JsonFileTokenStore, start } from "pumble-sdk";

const addon: App = {
  globalShortcuts: [
    {
      name: "Global shortcut",
      handler: async (ctx) => {
        await ctx.ack();
        console.log("Received global shortcut!");
        await ctx.say("Received global shortcut!");
      },
    },
  ],
  messageShortcuts: [
    {
      name: "Message shortcut",
      handler: async (ctx) => {
        await ctx.ack();
        console.log("Received message shortcut!");
        await ctx.say("Ok", "in_channel", true);
      },
    },
  ],
  slashCommands: [
    {
      command: "/slash_first",
      handler: async (ctx) => {
        await ctx.ack();
        console.log("Received slash command!");
        await ctx.say("Received slash command!");
      },
    },
  ],
  events: [
    {
      name: "NEW_MESSAGE",
      handler: (ctx) => {
        console.log("Received new message!", ctx.payload.body);
      },
    },
  ],
  eventsPath: "/hook",
  redirect: { enable: true, path: "/redirect" },
  tokenStore: new JsonFileTokenStore("tokens.json"),
};

start(addon);
