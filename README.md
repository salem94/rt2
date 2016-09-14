# rt2 - A minimalist routing library.

Yet another routing library, with a little inspiration from Node's Hapi framework and its <reply> function.
Rt2 comes with a different way of defining routes and, therefore, endpoints, loading them and dispatching requests to the appropriate route.

I personally don't like how routes are defined in Express, Koa and Hapi (though im far more close to Hapi's philosophy of less stuff defined programamtically, and more config files!).
Of course, these are far more mature and performant tools. This is, for now, just a toy for me.

I like to see routes as a group of data (an url pattern and a controllers/handlers) used to define an endpoint, and also i like to see them as a separate thing from the server application, although they can be defined inside the app as objects.

<More soon>.


