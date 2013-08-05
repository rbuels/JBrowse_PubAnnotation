define([
           'dojo/_base/declare',
           'dojo/_base/lang',
           'dojo/request',
           'dojo/Deferred',
           'JBrowse/Store/SeqFeature',
           'JBrowse/Model/SimpleFeature'
       ],
       function(
           declare,
           lang,
           request,
           Deferred,
           SeqFeatureStore,
           SimpleFeature
       ) {
return declare( SeqFeatureStore, {

  constructor: function() {
      this._deferred = this._deferred || {};
  },

  _defaultConfig: function() {
      return {
          query: { type: 'feature' }
      };
  },

  _getData: function( refName ) {
      if( ! this._deferred.root || this.curRefName != refName ) {
          var d = this._deferred.root = new Deferred();
          this.curRefName = refName;

          this._deferred.root = request.get(
              this.resolveUrl( this.config.urlTemplate, { refseq: refName } ),
              { handleAs: 'json' }
          );
      }
      return this._deferred.root;
  },

  getFeatures: function( query, featCallback, endCallback, errorCallback ) {
      var thisB = this;
      query = lang.mixin( lang.mixin( {}, this.config.query || {} ), query );
      this._getData( query.ref )
          .then( function( data ) {
                     if( query.type == 'feature' ) {
                         thisB._queryFeatures( query, data, featCallback, endCallback, errorCallback );
                     }
                     else if( query.type == 'reference' ) {
                         thisB._queryReference( query, data, featCallback, endCallback, errorCallback );
                     }

                     endCallback();
                 },
                 errorCallback
               );
  },

  _queryFeatures: function( query, data, featCallback, endCallback, errorCallback ) {
      var denotations = data.denotations || [];
      for( var i = 0; i<denotations.length; i++ ) {
          var d = denotations[i] || {};
          var span = d.span || {};
          if( !( span.begin > query.end || span.end < query.start ) ) {
              featCallback( this._makeFeature( d, i ) );
          }
      }
  },

  _queryReference: function( query, data, featCallback, endCallback, errorCallback ) {
      data = lang.mixin( { start: query.start, end: query.end, seq: (data.text||'').substring( query.start, query.end ) }, data );
      delete data.denotations;
      featCallback( new SimpleFeature(
                        { id: data.project+'/'+data.source_id+'/'+data.section,
                          data: data
                        }));
      endCallback();
  },

  _makeFeature: function( denotation, i ) {
      var span = denotation.span || {};
      return new SimpleFeature(
          {
              id: i,
              data: {
                  name:  denotation.id,
                  obj:   denotation.obj,
                  start: span.begin,
                  end:   span.end
              }
          });
  }
});
});