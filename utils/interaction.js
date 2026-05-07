const interactions = {
    pat: {
        tag: "pat", 
        color: "#ffcc00", 
        msg: "đã xoa đầu",
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDhpb3hheTN3aHh1eHdsNXQ2a2d0bWdnYmNpMDBhMDIyamV1djcxYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/X42IAaDJ42pHqPllGk/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDhpb3hheTN3aHh1eHdsNXQ2a2d0bWdnYmNpMDBhMDIyamV1djcxYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/AomVL3N8lTxiuYtI2I/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDhpb3hheTN3aHh1eHdsNXQ2a2d0bWdnYmNpMDBhMDIyamV1djcxYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ye7OTQgwmVuVy/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3c3JkMnNuZmM2aWU2c2Y2OXBtdmdhY2dxNzEwZ2g2ejh4Y2prM2dsbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/n68F3TASJ9jfJIenCB/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3c3JkMnNuZmM2aWU2c2Y2OXBtdmdhY2dxNzEwZ2g2ejh4Y2prM2dsbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/iFyvC3Ii6IwwsTL41J/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ejJtNmZ6dDFocWhybTU5cXl0Y2wyd3FoNmhncjczZzQ1OXFpOGpiaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/e9OZ6NYk1M3YTJDDgc/giphy.gif"
        ]
    },
    poke: {
        tag: "poke", 
        color: "#00ccff", 
        msg: "đã chọc", 
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjU5NjBmcWpneThlcnJwcGpld3g0ZHlsY3Vnems5dWRzZm03Z3BjYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/PkR8gPgc2mDlrMSgtu/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjU5NjBmcWpneThlcnJwcGpld3g0ZHlsY3Vnems5dWRzZm03Z3BjYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Vfie0DJryAde8/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjU5NjBmcWpneThlcnJwcGpld3g0ZHlsY3Vnems5dWRzZm03Z3BjYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uB5zE3KEU5pzMOXM1J/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a2dxcTVndndoaGxjbjIyMDN5d2kzOWxoZDB2NzRnMnN0NDdzandmOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/0v6wbrDeX1wb67KuoU/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a2dxcTVndndoaGxjbjIyMDN5d2kzOWxoZDB2NzRnMnN0NDdzandmOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LXTQN2kRbaqAw/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b3dpOTgzZGx4bjFnM24zcWowbXEzcnNxdGkxNmRha3M0Y2h2NDRzYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/QVI2faNSfJlUQEIgzv/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b3dpOTgzZGx4bjFnM24zcWowbXEzcnNxdGkxNmRha3M0Y2h2NDRzYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UeFaVGOHEcY6B1koEq/giphy.gif"
        ]
    },
    bite: {
        tag: "bite", 
        color: "#ff5555",
        msg: "đã cắn", 
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM21ucGZvamdsbWpydm1tdjFhNXM4aWJlamlnazh4YmNsa21sbmVyaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WW3NSMgcR4ZGM/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM21ucGZvamdsbWpydm1tdjFhNXM4aWJlamlnazh4YmNsa21sbmVyaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lrMUMn9lnpaJDsvP0u/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWN3OGZqc3Z1cnp4Ym11Z3o0aGNidnRqc3ZrYmw0MGZmdGFjNTdueSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LO9Y9hKLupIwko9IVd/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZnFsaHZkcG1ma3F5NHhlNnh5aHFoOTR1eXduM3MyOXY3cjlvd2U5eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ixoMvaJ2NhFgouq9aY/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3d3A4dDlpd3R5dmN0ZmEwaXZ0d2JucjVwMjc1OGp2NDZrZjh2MGx3NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7rAYDoEhokWEpk0vw2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a2Z4ZXM2dmliNDU4dW41ZXlhbm5haGRwbnJnbDRzcGV4aHAxN3Z6ZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/N5RJXC61foVShDC4Fw/giphy.gif"
        ]
    },
    punch: {
        tag: "punch",
        color: "#880000",
        msg: "đã đấm",
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jZln1k7P9dO3g2Dgu4/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qPzZQtsv21zjy/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OpvUphysvKumQ/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmE3bDQyeTlwNm9rdnVtZXRjbzQzb2EzeDFkbjYydnZmbTNidzBxZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ptmWoT5ZoeStn3PP5v/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWgyNnhnMmxiajd4ZTN3bjc3cjNndWNndHJkbGxja2o1aGt4YzdhbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/dICjAqixKQFnG/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eG1laTNnNHMzc25zZjVjcG5tZXF6ZTJ1ZHgzOGhiOTA0Z3ZxYjh3aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/NuiEoMDbstN0J2KAiH/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eml6dHN4NjZuajUwb3E2eGdrdm9qZnl0aTUwMm96MWF0aGE3bXd2cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/egTp9zxBnpl7k1BfST/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dGhhYTVyeGRnaHE0c2x1NXo4M3ZueHZnYTNwZjh2cm91cnA3eXg0dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/AlsIdbTgxX0LC/giphy.gif"
        ],
        lovePoint: -10,
    },
    bonk: {
        tag: "bonk",
        color: "#000000",
        msg: "đã gõ đầu",
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pPs4HwdYb46fWfnpje/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/K2PhVaUSgGKkDsXeEa/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/rfHc3U73N07tKPgCvJ/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJneHVpeHoyb2wya3Zzc3Zoem8zdDBvazd2aTdjbW9uM2d6d25lbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fsa01PUHKndNNCcadS/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjUxZTJrZ212b3c1a2xhZzh3NTBwcmE0dmw2azBhbWltbnpuaHZrcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qs4ll1FSxKnNHeSmom/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWRybW1lc3BxcTRtOXFhd3U2bWVremJxazRmamNnZmpyc2NrOTFiZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l4DeddeQzgoAfcBHze/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWRybW1lc3BxcTRtOXFhd3U2bWVremJxazRmamNnZmpyc2NrOTFiZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7jBEjor8mSNAvgLmhC/giphy.gif"
        ],
        lovePoint: -5,
    },
    slap: { 
        tag: "slap", 
        color: "#ff4500", 
        msg: "đã tát", 
        lovePoint: -10,
        images:[
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYW1hYTZkM2h3eTJ4NGM4cml5MzF3N3c1aGxybjdyZzlrcmFqcTJ6cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Gf3AUz3eBNbTW/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYW1hYTZkM2h3eTJ4NGM4cml5MzF3N3c1aGxybjdyZzlrcmFqcTJ6cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xUNd9HZq1itMkiK652/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYW1hYTZkM2h3eTJ4NGM4cml5MzF3N3c1aGxybjdyZzlrcmFqcTJ6cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WvzGVdiVRNq8qtWPKu/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYW1hYTZkM2h3eTJ4NGM4cml5MzF3N3c1aGxybjdyZzlrcmFqcTJ6cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xUO4t2gkWBxDi/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZTN3M2xtdzJkczlmdDdmeGJ2cWh0eGphMXQ5bHN6cjBqc3JmN2FvMCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/k1uYB5LvlBZqU/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b2xoOXo1cGo2eXhkenozZHR3YzA1eHZ2bW9lY3RhZmh4dzVxZzN3NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qNtqBSTTwXyuI/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eHB3eWxwZ211MWx6Y21lMGM5cjB2ZjdybDF5bHZkcDgxeHo0ZjF4MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qKVmaTFKDqnrwBlR1B/giphy.gif"
        ]
    },
    hug: {
        tag: "hug",
        color: "#00ff00",
        msg: "đã trao một cái ôm ấm áp với",
        lovePoint: 5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjM1aGw5cnVlZHBjZXhtOG95a2dmOThkaXVwZ2E0M3Z3YTl6a3QyYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/IRUb7GTCaPU8E/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjM1aGw5cnVlZHBjZXhtOG95a2dmOThkaXVwZ2E0M3Z3YTl6a3QyYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/svXXBgduBsJ1u/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjM1aGw5cnVlZHBjZXhtOG95a2dmOThkaXVwZ2E0M3Z3YTl6a3QyYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/u9BxQbM5bxvwY/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjM1aGw5cnVlZHBjZXhtOG95a2dmOThkaXVwZ2E0M3Z3YTl6a3QyYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WynnqxhdFEPYY/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjM1aGw5cnVlZHBjZXhtOG95a2dmOThkaXVwZ2E0M3Z3YTl6a3QyYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lrr9rHuoJOE0w/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjM1aGw5cnVlZHBjZXhtOG95a2dmOThkaXVwZ2E0M3Z3YTl6a3QyYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/svXXBgduBsJ1u/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjM1aGw5cnVlZHBjZXhtOG95a2dmOThkaXVwZ2E0M3Z3YTl6a3QyYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/143v0Z4767T15e/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OWJsNnR5bGFleHdzd3BpZzJkY3YyaW5qd28wMG5pa241bzIwZnV5bSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/m2GGGWxexjwqnHQnZI/giphy.gif"
        ]
    },
    kiss: {
        tag: "kiss",
        color: "#FF1493",
        msg: "đã trao một nụ hôn nồng cháy cho",
        lovePoint: 10,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3h3dzhna2pveXdnZmM3OW1nemE5MjV1NWoweDRvOXhxOWcxb3JzMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MQVpBqASxSlFu/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3h3dzhna2pveXdnZmM3OW1nemE5MjV1NWoweDRvOXhxOWcxb3JzMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/11rWoZNpAKw8w/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3h3dzhna2pveXdnZmM3OW1nemE5MjV1NWoweDRvOXhxOWcxb3JzMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zkppEMFvRX5FC/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3h3dzhna2pveXdnZmM3OW1nemE5MjV1NWoweDRvOXhxOWcxb3JzMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/QGc8RgRvMonFm/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3h3dzhna2pveXdnZmM3OW1nemE5MjV1NWoweDRvOXhxOWcxb3JzMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jR22gdcPiOLaE/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3h3dzhna2pveXdnZmM3OW1nemE5MjV1NWoweDRvOXhxOWcxb3JzMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FqBTvSNjNzeZG/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHhudnFmMTV5MTNmMnc4c2pjbXVlcjZvbXV0OHR5MGpldnpyaWE4bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KmeIYo9IGBoGY/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aWFleTEzandtMTd0Z2drZTh6b3B0aTRxYXV1emMyc2lwb3BxdDZhYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bm2O3nXTcKJeU/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHhudnFmMTV5MTNmMnc4c2pjbXVlcjZvbXV0OHR5MGpldnpyaWE4bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/rhnibMSVMeQy5ZdfPP/giphy.gif"
        ]
    },
    airkiss: {
        tag: "airkiss",
        color: "#add8e6",
        msg: "đã gửi một nụ hôn gió tới",
        lovePoint: 5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a2l1eXo2eHZsb3EzbXBsc3RncmltbDJ1cDJuY3lobzRhcnIxYnA4MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/HN0vI0nbR9jX2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWpsemJ2dXRlYTZsajFiaHc2cmQ0cnVoa3c5enNkZ3B4eW1zNDY5aiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uAvMPK3narqc8/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZjZvMGk2N2R4aXp4OW5wd2p4dzFmbDhrYXJ2aDR1OWp2dDVoODdnNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/9VTe635RMSfEkGaZGd/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N3l0ZXNsc2MybDQycGV3eDM0dnBvbGZiNDNwczZhY282eW9laGF3dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/VLqvh9JBs0lQnIOOn5/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzFkcGlua292dDd5bzg5bXR4ejh4aTVucWozZXJhZmNkM3duZ2p0NyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/108M7gCS1JSoO4/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTZjMDliOTUyZjJuMWE1azNnZjAwbTZsd3RoYjN3M285NXZodWNtY2NkODRsdG00ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dKBES1ypGwZdyFQBQ7/giphy.gif"
        ],
    },
    cuddle: {
        tag: "cuddle",
        color: "#FFB6C1",
        msg: "đã ôm ấp thật nồng thắm với",
        lovePoint: 5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWF1dmxiN292emo2MjQ5Y3lvZTFwdjBma211NW1jczc5cndxcDRjMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Y8wCpaKI9PUBO/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWF1dmxiN292emo2MjQ5Y3lvZTFwdjBma211NW1jczc5cndxcDRjMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BXrwTdoho6hkQ/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bTZlMjM1N3p0bm03aGhvNGJ2YTQwdndrZWZqMmphdDNxdDcwZDB4dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bQATeUxCoCFr2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OXRjZTZqcnJla2tqdjYza2tzNndoN3hsNjRzcWRqazF0MWZlMTFpYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eMpDBxxTzKety/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OXRjZTZqcnJla2tqdjYza2tzNndoN3hsNjRzcWRqazF0MWZlMTFpYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZWVRU8BCEq24lpgopT/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YXU5djYzdDFuZmxlbHI1NzNtZGFvZWQxbHQ5amVoeDAybG4yNTdhaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3rgXBSoIApjSYTo8vK/giphy.gif"
        ]
    },
    lick: {
        tag: "lick",
        color: "#FF69B4",
        msg: "đã liếm",
        lovePoint: 5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5cREBFcGOkC2I/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8GiREm7aqMwN2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mG8g5NyTfJkqH4xk0d/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3AyaXp4ZjFpdDhiMTQwMmk0N2J3NnEweHY4eWMwbGZhcng5eXZsaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DTbmKtrYbwUkw1Inyv/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHJqMnhmdGNqdGd4d3p0Z2cwc2kxY3BudmEwcmdrNXZlbzZkcGlkZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/bfPYlvbKB4Q1xCczLs/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdG1jZTF1eGJyNzh6M2NzNTdzbThiNGVuNjl4dWZ5cDc1aG9hdzdnYiZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/e2vHdcypp0CBWnun8P/giphy.gif"
        ],
    },
    kick: {
        tag: "kick",
        color: "#8B0000",
        msg: "đã tung một cú đá sấm sét vào",
        lovePoint: -10,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDR1eWJmZW8xMWw5cXEybnJ5a2hsazJhYmNidTZ6ZmVtdGtlenZ3dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/sRYXGc13Mk9jHWfpBN/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDR1eWJmZW8xMWw5cXEybnJ5a2hsazJhYmNidTZ6ZmVtdGtlenZ3dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cb4Pg4jau2SEE/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cWdidzIxbTZ2dDRubzluaDJsajM3bTBzYnc3NDd5bmxmaDVwd2N4biZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7dnvXm1zNQVNjRWFi1/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTVoejRtOTE2ZGtxNGh3a3dsdmk3eHAxdDJhcjNnNzM3aW10cmFmMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/TdWhgxI3IhLcCE3waI/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTVoejRtOTE2ZGtxNGh3a3dsdmk3eHAxdDJhcjNnNzM3aW10cmFmMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wOly8pa4s4W88/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGlyNjJ3a2prMm51d3k3OThlczFuMnNrODhzenQwOHNpejN0bjM2ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8UShaoMBBeK7aJsqaI/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aDdhM2Y0cDluZHVqcW9xaGpieGp6ODc3bXhzNnp6ZGh5cGI4OXllYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/PAIDLoFjqaSvulJ0pu/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3a290dnV1NHd4cDM5M3R3aHhrNjB6cmNoNXZwendoYzR6anhtOXIyNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/GjJsRwNeSXKtBrTZuQ/giphy.gif"
        ]
    },
    highfive: {
        tag: "highfive",
        color: "#00FF7F",
        msg: "đã đập tay cực ngầu với",
        lovePoint: 2,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTd6aTUxM2dhZzE3ZzN0bnZkbzJuZmhqMnY5NWZwNjkxY3h6MnlvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/jA2lAbJcCfac6uz3ef/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTd6aTUxM2dhZzE3ZzN0bnZkbzJuZmhqMnY5NWZwNjkxY3h6MnlvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b5L1Lt3k4hGNDZWVIw/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTd6aTUxM2dhZzE3ZzN0bnZkbzJuZmhqMnY5NWZwNjkxY3h6MnlvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/65HR2UL6nn6XMSUoRA/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTd6aTUxM2dhZzE3ZzN0bnZkbzJuZmhqMnY5NWZwNjkxY3h6MnlvOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pArxuKlrWbnsJFrIOO/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b2xzb3lqa3M1ZmI3dWxoNzk0emN6bnYxMmN0NDQ0enN5bGZwNGhicSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ve2MTLvfHVjE36y7C0/giphy.gif"
        ]
    },
    stare: {
        tag: "stare",
        color: "#4682B4",
        msg: "đang nhìn chằm chằm (phán xét) vào",
        lovePoint: -2,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExamoxeW1vMmRzcnlwMXg2d3RqeW1wY2ViaWkxc2M2bXJteHNhdHphbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/NGsRCZ0huIMXoMWNTE/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExamoxeW1vMmRzcnlwMXg2d3RqeW1wY2ViaWkxc2M2bXJteHNhdHphbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MUYxXNiLJHSKBQBAny/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YnpwYjRzMWxhd2sxcjRsZzg0YWsxeWc1Z2gzeDE4bXVwMm5ieHViMCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ucGvupudOZLuKwTxvW/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDBvcnlvY3poYmFqNHBzZnNuNGR0ZHhwdmh4OHJjN2txd3V3NzNjOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KsMT02cXvy0AN7j4Md/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHljdXQ1MGgxdnRwYTF5aGdjeHB3YTZmNTI2dXF5N2hmYmZieDVhdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/FtWjcJ02O4WpBp57cx/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG01ZHE0MjVhbDN6OTdhMG9oaWVtMWdleXRlejJ4d2x2ZG5hanhncSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/UvgN66m0YDnzy/giphy.gif"
        ]
    },
    laugh: {
        tag: "laugh",
        color: "#f1c40f",
        msg: "đã cười vào mặt của",
        lovePoint: -5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmJubjVvOWhlZzl4emF1MWw4aTFtazJzZnluYnBodXFzZjFsdHhubCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2g6sCTsSoVuSfSxK4W/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aXV0aDBzeWo3eWRmaXB6MG50MDJ3ZDZrc244cGpiaDM3Mzc3ZHI4aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/GhjexFacI6U7TGCd09/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aXV0aDBzeWo3eWRmaXB6MG50MDJ3ZDZrc244cGpiaDM3Mzc3ZHI4aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZechFo0yBIQpEve1Sm/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHY2NDVqb2ppaWJsanN2MzAyZXZzbnhpbmFpcHY3dnJhcWhwdnVuaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fYvSlf9tbKm7XLOLrR/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNm1wazRoZXR2azFxbXhlbTAwd2VxMGd6aGlobmhsYm95bXFvbmpueiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/fb5lozVxhBwVFFByW8/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eXB0MWk3ejdibDJkM3NmaWZiem43cnR3cWxzNjkzanZjOTMzczNueSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/0SVAVxeJsnJ1WRMIPX/giphy.gif"
        ]
    },
    cheek: {
        tag: "cheek",
        color: "#FFCCFF",
        msg: "đã thơm má",
        lovePoint: 5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3Bkd3djcWZodGkxNXd3NHFqaGx6NDNjcWNwd2c4ajV0NzZtN3EzeiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gRSqTmhQ3ayroAQ04S/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHUzbjNzY3A4Mzhud3d4NWlpYWh2YjN3MjJqaW9jcTAzbmJtMW83cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/qfQgXxBz1nvWEbOxyb/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z2prMWJsY21naTVvaWpvczJqczFkZDJ2d3d2bmYxNng0Z2Z1cXhheiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2Sqg8jQBDXKZKXKg/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Z2prMWJsY21naTVvaWpvczJqczFkZDJ2d3d2bmYxNng0Z2Z1cXhheiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2Sqg8jQBDXKZKXKg/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2NkcDdoejEwb3NkNDl0YXl2aHJ1NDIxaGF1cWhrZzZ1bmMwZzRnciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4Tw8zXonwNkLS/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDUxenIza3h5dTV4a3F2NGN2djV5eHBzcjhhazYzdjl0OW5lamJ0dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xR5cPyPoL5HVXSphqA/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDUxenIza3h5dTV4a3F2NGN2djV5eHBzcjhhazYzdjl0OW5lamJ0dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KmxmoHUGPDjfQXqGgv/giphy.gif",
        ],
    },
    pinch: {
        tag: "pinch",
        color: "#9b59b6",
        msg: "đã véo má",
        lovePoint: -5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NnUyZGM3bHJ6YXR1M28xZGo4MGt0d2RtYW93NW9qdmI0cGd2azgydiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MC7fYhbA4ociQ/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnJqdm1jYTV3ZHNhdjJzZHdicXZtNWQ0cGp1eHNyeHBoc2t3NGRuZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o6nUWtsrEqktR2fcY/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnJqdm1jYTV3ZHNhdjJzZHdicXZtNWQ0cGp1eHNyeHBoc2t3NGRuZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/BzZBWdEkSFQAhwwxkt/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1uYWEwdjJxOHdwcDBqOGJxZTQyZWpleGc1dnJpMXF3d3VxNDljcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YFpZFrk2iHv7l7UEin/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Nm1uYWEwdjJxOHdwcDBqOGJxZTQyZWpleGc1dnJpMXF3d3VxNDljcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b2eTtzh6tMs7KVoFzV/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnJwNGxrdW1yZjlhNzZ3bGQ2bXQydnFrajU4anl3cmFucmlhbXg0YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hjl9IjqlGjPBfSJ7lc/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnJwNGxrdW1yZjlhNzZ3bGQ2bXQydnFrajU4anl3cmFucmlhbXg0YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/QEIZCBGgftX0YuuAfE/giphy.gif"
        ],
    },
    can_yeu: {
        tag: "nibled",
        color: "#FF1493",
        msg: "đã cắn yêu",
        lovePoint: 5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OHUzbjNzY3A4Mzhud3d4NWlpYWh2YjN3MjJqaW9jcTAzbmJtMW83cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DdJ9RsY88uBarMvVsb/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWRneDg1cTA0d2tza3pkZ3R2MGhwMDJ3cDVzYmw0ZHBhZmFjOTMwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YW3obh7zZ4Rj2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWRneDg1cTA0d2tza3pkZ3R2MGhwMDJ3cDVzYmw0ZHBhZmFjOTMwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0Iy0QdzD3AA6bgIg/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXYya25kbzlvczAycWdxOXhuNmV1MHkxZDRiaGo1MTdmeG9lOXRrZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/108wBdjDIkQZb2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ejUyeHUzZXcwcnl3cHNjaHZkOG80djBqNWdobG11N2FyeXU1YTB0OCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LO9Y9hKLupIwko9IVd/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjJuOXl4aTRlbnR5czhsazlzdW42eHIwMWE2dmtoNGJmeWY0engzZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/F7EakqG1ICDnRSe9ff/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM21ucGZvamdsbWpydm1tdjFhNXM4aWJlamlnazh4YmNsa21sbmVyaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mEMRAZYygRyk8/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dGc5cTRqbnBnaXRzZTVxdXl1ZXpkM2g5NmNwbXJuODRpMHl6ZzJ6aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/U1wMHRq7bnuInYaVlB/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3d3A4dDlpd3R5dmN0ZmEwaXZ0d2JucjVwMjc1OGp2NDZrZjh2MGx3NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/W5tiV5EyW4TL4xToti/giphy.gif"
        ],
    },
    fight: {
        tag: "fight",
        color: "#FF4500",
        msg: "đã đánh nhau với",
        lovePoint: -10,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2Pk9newN8fkbu/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eR7OEDQDyA7Cg/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6ULDGyRw0uhECEhAaQ/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/f5UwtpUbrAEE0/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wiaoWlW17fqIo/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/KmG26GNmdWOUE/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHpxY3pjZmp1dHJzY2RpeTRhdzZjOTB2eGwxZXNvanZtcm1yeGZwYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1xONKAmjT1GHFpkLRd/giphy.gif",
        ],
    },
    rip: {
        tag: "rip",
        color: "#FF4500",
        msg: "thành kính tưởng nhớ",
        lovePoint: -5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGhveWxrd3J3c2hxc3RmcjltcnVpb3cybDVjaW5yMXZnazJ2azV3NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JoV2BiMWVZ96taSewG/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGhveWxrd3J3c2hxc3RmcjltcnVpb3cybDVjaW5yMXZnazJ2azV3NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/12UPyerJpVC2PzWkrz/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGhveWxrd3J3c2hxc3RmcjltcnVpb3cybDVjaW5yMXZnazJ2azV3NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/56MCwZ3SCzp1NjSirn/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3c2V6N2lqaHNleWJ0cnk5MWlkYjl6eTVzNzdnY3lvN2RmeDQwajFtNCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/j6ZlX8ghxNFRknObVk/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YTV1OW0wMWdvNzFwOHFleGkzaWw4d3dsMnZjamk2NDV2cnBtcXMxYSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/cJ4F7Tj2PZaDiLNvW5/giphy.gif",
        ],
    },
    spank: {
        tag: "spank",
        color: "#FF4500",
        msg: "đã tét đuýt",
        lovePoint: -5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWxkenp6ZHh3eDZreWJ3ZThlcG4zOXNpajc4dTBuOXhzOTZ3NG5ydCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/v4UdKrxhIiB1QFmO6b/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWI4NGxvNTdhdzg1bjd0cHlqMWUwcTNieW9yMHc4eTJmMHhzZ2p4OCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/1gv7WwUYJlaRKWVtok/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWI4NGxvNTdhdzg1bjd0cHlqMWUwcTNieW9yMHc4eTJmMHhzZ2p4OCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/cl3EMK5vlECNO2UJr2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3p4Zmw5MDBrc2RmMXZydHF4bzdvMXo3YW0ycjBsZnN2ZXNiNjFhYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pRotk2UQTsozm/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eDAzaGZ4M3I2Ym44bGp0OGRicnFkcndrcGRoNmRteXVlNTRxZWw2eCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/jdrgQXu2qdL1e/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eDAzaGZ4M3I2Ym44bGp0OGRicnFkcndrcGRoNmRteXVlNTRxZWw2eCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/cxWG5eigQt1K0/giphy.gif",
        ],
    },
    hien_te: {
        tag: "sacrifice",
        color: "#1c082c",
        msg: "đã hiến tế",
        lovePoint: -5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZzloN3diaHg0b2dlYmc2OTA3Nmp0dnp5N3o0YmtuMDAxam41ZjVlbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RyAZDGzXdyhc1szx2R/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bmJld3NkemplY2EzcnZweGJ1NmQweXJpNXBmeWh4ZjQwZXFtcHkwNiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zPbYWiX4akME1dSqRf/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGgzYW9zYWkzb21sdnNvaDc1Z3lrb3hkOTl1YzZ5ZjIxZ2ZzNXFpayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/La3G8N3tn4nzW/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NnB3ZW5wc3A0dGY4ZmJ3cWl5azQ0ZTcwamUxMXBpeW50Z3p1OXNraiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1vRgUJWrZ5Sfy93IjM/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3b2prZzZjbm91ZWY0bjkyMDV4a2JydnVlODRxMjNkNWt6Yjg3a285ZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WKFprEiHzNDttpPCIf/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2Y2NzYwd2R3eWd1MGM2cTV6dGlwcmVuc2d5NGU2ZXowYjRvYWN4bSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lsuzxXh9Eiwqz1jlHv/giphy.gif",
        ],
    },
    shoot: {
        tag: "shoot",
        color: "#1b1202",
        msg: "đã bắn",
        lovePoint: -5,
        images: [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG5qeHgzdDMxdGt0ZjN6ZmU2aDZ6YW04Nm9sYzloeTl6bGx2aDJ5MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10ZuedtImbopos/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG5qeHgzdDMxdGt0ZjN6ZmU2aDZ6YW04Nm9sYzloeTl6bGx2aDJ5MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/28p7K4xfPHK8w/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG5qeHgzdDMxdGt0ZjN6ZmU2aDZ6YW04Nm9sYzloeTl6bGx2aDJ5MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/LJ7fPC06m5xDC2pSGX/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG5qeHgzdDMxdGt0ZjN6ZmU2aDZ6YW04Nm9sYzloeTl6bGx2aDJ5MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/IgCUUBKeBozqLcZEOj/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG5qeHgzdDMxdGt0ZjN6ZmU2aDZ6YW04Nm9sYzloeTl6bGx2aDJ5MyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xTiN0m0FurL9m3KdRS/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExenRsM2s1djJpMDM1aG1kaTEzMGc3bTY3YmZkZnI2dzk4bGVnb2hyaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/d2QCorOWTId6jnODgv/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExenRsM2s1djJpMDM1aG1kaTEzMGc3bTY3YmZkZnI2dzk4bGVnb2hyaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/a5OCMAro7MGQg/giphy.gif"
        ],
    },
};

module.exports = {
    interactions
}