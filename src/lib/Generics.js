import Vue from 'vue';
import elasticsearch from "elasticsearch";
import Store from './Store';

export default Vue.mixin({
    computed : {
      // Full Elasticsearch request
      Request : function() {
        return Object.assign(
          {
            index : this.Header.Index,
            type : this.Header.Type
          },
          {
            body : this.Bodybuilder.build()
          }
        );
      },

      // Request header (index, type, client)
      Header : () => {
        return Store.getters["Elasticsearch/GetHeader"];
      },

      // Request query (alterable)
      Bodybuilder : () => {
        return Store.getters["Elasticsearch/GetBodybuilder"];
      }
    },

    methods : {
        /*
          Store Elasticsearch Header Setters
        */
        SetHost : (host) => {
          Store.commit("Elasticsearch/SetHost", new elasticsearch.Client({ host }));
        },
        SetIndex : (index) => {
          Store.commit("Elasticsearch/SetIndex", index);
        },
        SetType : (type) => {
          Store.commit("Elasticsearch/SetType", type);
        },

        /*
          Execute request
        */
        Execute : function() {
          // Debug
          console.log(this.Request);
          console.log(this.Bodybuilder.build());

          this.Header.Client.search(this.Request).then(function (resp) {
            Store.commit("Reset");
            var hits = resp.hits.hits;
            console.log("Debug Hits : ", resp);
            if (hits.length === 0) {
              Store.commit("Score", 0);
            }
            else {
              var score = 0;
              hits.forEach((obj) => {
                score++;
                Store.commit("Item", obj);
              });
              Store.commit("Score", resp.hits.total);
            }
          }, function (err) {
            Store.commit("Score", 0);
          });
        },





        // Triggered when user uses SearchBox component
        SearchOnBox : function (data) {
          var query = {
            index : this.Header.Index,
            type :this.Header.Type,
            body : {
              from : 0,
              size : 100,
              query : {
                bool : {
                  must : {
                    prefix: {
                      [data.query]: data.val
                    }
                  }
                  ,
                  filter : {
                    bool : {
                      must: Store.getters.getFilters()
                    }
                  }
                }
              }
            }
          };
          Store.commit("setQuery",query);

          this.search();
        },

        search : function () {
          var query = Store.getters.getQuery();
          this.Header.Client.search(query).then(function (resp) {
            Store.commit("Reset");
            var hits = resp.hits.hits;
            console.log("Debug Hits : ", resp);
            if (hits.length === 0) {
              Store.commit("Score", 0);
            }
            else {
              var score = 0;
              hits.forEach((obj) => {
                score++;
                Store.commit("Item", obj);
              });
              Store.commit("Score", resp.hits.total);
            }
          }, function (err) {
            Store.commit("Score", 0);
          });
        }
    }
});
