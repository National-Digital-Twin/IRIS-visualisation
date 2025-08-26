window.togglePopoutInfo = function () {
    const tooltip = document.getElementById('popout-info');

    switch (tooltip.style.display) {
        case 'none':
            tooltip.style.display = 'block';
            break;
        default:
            tooltip.style.display = 'none';
            break;
    }
};

window.hidePopoutInfo = function () {
    const tooltip = document.getElementById('popout-info');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
};
