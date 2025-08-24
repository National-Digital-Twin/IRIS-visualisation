window.togglePopoutInfo = function() {
    const tooltip = document.getElementById('popout-info');

    switch(tooltip.style.display) {
        case 'block':
            tooltip.style.display = 'none';
            break;
        default:
            tooltip.style.display = 'block';
            break;
    }
};

window.hidePopoutInfo = function() {
    const tooltip = document.getElementById('popout-info');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
};
