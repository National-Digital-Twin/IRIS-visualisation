window.toggleWindDrivenRainScenario = function (button, prefix, properties) {
    const buttonGroup = button.parentElement;
    if (buttonGroup) {
        buttonGroup.querySelectorAll('.scenario-button').forEach((btn) => {
            btn.classList.remove('checked');
        });
        button.classList.add('checked');
    }

    const dataList = document.getElementById('scenario-data');
    const windDirections = [
        { direction: 'North', key: '0' },
        { direction: 'North east', key: '45' },
        { direction: 'East', key: '90' },
        { direction: 'South east', key: '135' },
        { direction: 'South', key: '180' },
        { direction: 'South west', key: '225' },
        { direction: 'West', key: '270' },
        { direction: 'North west', key: '315' },
    ];

    const headers = `
            <dt>Wall orientation</dt>
            <dd>Wind-driven rain index (mm/year)</dd>
        `;

    dataList.innerHTML =
        headers +
        windDirections
            .map(({ direction, key }) => {
                const value = properties[prefix + key];
                return `
                <dt>${direction}</dt>
                <dd>${value && typeof value === 'number' ? value.toFixed(3) : 'N/A'}</dd>
            `;
            })
            .join('');
};
