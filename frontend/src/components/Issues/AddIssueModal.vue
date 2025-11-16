<template>
    <div class="overlay">
        <div class="modal">
            <div class="header">
                
            </div>
            <div class="modal-content">
                
            </div>
        </div>
    </div>
</template>

<style scoped>
.header{

}
.modal{
    width: 76vh;
    height:76vh;
    background-color: #2b2d31;
}
.overlay{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
</style>