class Util {
    constructor() {
        throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
    }

    static disambiguation(items, label, property = 'name') {
        const itemList = items.map(item => `"${(property ? item[property] : item).replace(/ /g, '\xa0')}"`).join(',   ');
        return `Multiple ${label} found, please be more specific: ${itemList}`;
    }

    static paginate(items, page = 1, pageLength = 10) {
        const maxPage = Math.ceil(items.length / pageLength);
        if (page < 1) page = 1;
        if (page > maxPage) page = maxPage;
        let startIndex = (page - 1) * pageLength;
        return {
            items: items.length > pageLength ? items.slice(startIndex, startIndex + pageLength) : items,
            page,
            maxPage,
            pageLength
        };
    }

    static cleanContent(content, msg) {
        return content.replace(/@everyone/g, '@\u200Beveryone')
            .replace(/@here/g, '@\u200Bhere')
            .replace(/<@&[0-9]+>/g, roles => {
                const replaceID = roles.replace(/<|&|>|@/g, '');
                const role = msg.channel.guild.roles.get(replaceID);
                return `@${role.name}`;
            })
            .replace(/<@!?[0-9]+>/g, user => {
                const replaceID = user.replace(/<|!|>|@/g, '');
                const member = msg.channel.guild.members.get(replaceID);
                return `@${member.user.username}`;
            });
    }
}

module.exports = Util;