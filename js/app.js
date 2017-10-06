$(document).ready(function(){
    
    //model object
    let listData = function(data,time){
        this.item = ko.observable(data);
        this.striked = ko.observable(false);
        this.timestamp = ko.observable(time);

       this.strike = function(x) {
           if (this.striked()) {
               this.striked(false);
           } else {
               this.striked(true);
           }
       }
    }
    //VM
    let ViewModel = function() {
        let self = this;

        self.listItems = ko.observableArray([]);

        self.itemToAdd = ko.observable("");

        self.addToList = function(){
            let item = self.itemToAdd();
            let currentTime = (new Date(Date.now())).toLocaleDateString();
            self.listItems.push(new listData(item,currentTime));
            self.itemToAdd("");
        }

        self.clearList = function() {
            self.listItems.removeAll();
        }

        self.hasItem = ko.computed(function(){
            return (self.itemToAdd());
        })

        self.isNotEmpty = ko.computed(function(){
            return (self.listItems().length);
        })

        self.removeItem = function(item){
            self.listItems.remove(item);
        }

        
    } 

    //ko apply bindings
    ko.applyBindings(new ViewModel());
    let map;

    function initMap(){
        map = new google.maps.Map(document.getElementById("map"),{
            center: {lat: 40.7134, lng: -74.0055},
            zoom: 12
        });
    }
});

