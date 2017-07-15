const PAGE_CONTENT = document.getElementsByClassName('page__content')[0];
const HEADER_TAGS = document.getElementsByClassName('header__tags')[0];
const FOOTER = document.getElementsByClassName('footer')[0];
const SEARCH = document.getElementsByClassName('search__input')[0];
const FORM = document.getElementsByClassName('search__form');
const TAG_SELECTED = 'tags-list--selected';
const TAG_LIST_SELECTED = 'tags-list--selected';

FORM.onsubmit = (event) => event.preventDefault();

let tagsSet = new Set();
let savedTags = getSavedTags();

let fetchData = fetch('https://api.myjson.com/bins/152f9j')
    .then((response) => {
        return response.json();
    })
    .catch((error) => {
        console.log(error);
    });

fetchData.then((posts) => {
    for (let post of posts.data) {
        collectPostTags(post);
    }
    posts.data.sort(sortByDate);
    if (savedTags) {
        posts.data = selectedTags(posts.data, savedTags);
    }
    fetchTagsList(tagsSet);
    infiniteScroll(posts.data);
    let searchDelay = 0;
    SEARCH.addEventListener('keydown', () => {
        clearTimeout(searchDelay);
        searchDelay = setTimeout( () => searchPosts(posts.data, SEARCH.value), 200);
    });
});
function getSavedTags() {
    let localTags = localStorage.getItem('tags');
    if (localTags) {
        return new Set(localTags.split(','));
    } else {
        return new Set();
    }
}
function updateContent(posts) {
    while (PAGE_CONTENT.lastChild) {
        PAGE_CONTENT.removeChild(PAGE_CONTENT.lastChild)
    }
    if (!posts.length) {
        emptySearchResult();
    }
    infiniteScroll(posts);
}
function toPartArray(arr, chunk = 10) {
    let parted = [];
    for (let step = 0; step < arr.length; step += chunk) {
        parted.push(arr.slice(step, step + chunk));
    }
    return parted;
}
function isAppearOnScreen(element) {
    let shape = element.getBoundingClientRect();
    let html = document.documentElement;
    return (
        shape.top >= 0 &&
        shape.left >= 0 &&
        shape.bottom <= (window.innerHeight || html.clientHeight) &&
        shape.right <= (window.innerWidth || html.clientWidth)
    );
}

function searchPosts(posts, text) {
    window.scrollTo(0, 0);
    let textLowerCase = text.toLowerCase();
    let filteredPosts = posts.filter(post => post['title'].toLowerCase().includes(textLowerCase));
    if (filteredPosts) {
        updateContent(filteredPosts);
    } else {
        updateContent(posts);
    }
}

function infiniteScroll(posts) {
    let partedPosts = toPartArray(posts);
    generatePosts(partedPosts.shift());
    document.onscroll = () => appendNext(partedPosts);
}

function emptySearchResult() {
    let title = document.createElement('h2');
    title.classList.add('content__empty-title');
    title.innerHTML = "No document found.";
    PAGE_CONTENT.appendChild(title);    
    let advices = document.createElement('p');
    advices.classList.add('content__empty-advices');
    advices.innerHTML = "Advices: Make sure all words are spelled correctly. Try other keywords. Try to use more general words.";
    PAGE_CONTENT.appendChild(advices);
}

function appendNext(posts) {
    if (posts.length && isAppearOnScreen(FOOTER)) {
        generatePosts(posts.shift());
    }
}
function eqSet(as, bs) {
        if (as.size !== bs.size) return false;
        for (var a of as) if (!bs.has(a)) return false;
        return true;
        }
function selectedTags(posts, tags) {
    for (let post of posts) {
        let postTags = new Set(post['tags']);
        let match = new Set([...tags].filter(tag => postTags.has(tag)));
        post['filter_condition'] = eqSet(tags, match);
    }
    let splitByMatch = posts.reduce((matchPosts, post) => {
        if (!matchPosts[post.filter_condition]) {
            matchPosts[post.filter_condition] = [];
        }
        matchPosts[post.filter_condition].push(post);        
        return matchPosts;
        }, {});
    let postsList = [];
    for (let matchPosts of Object.keys(splitByMatch)) {
        splitByMatch[matchPosts].sort(sortByDate);
        postsList.unshift(...splitByMatch[matchPosts])
    }
    return postsList;
}

function fetchTagsList(tags) {
    let headerTags = document.createElement('ul');
    headerTags.classList.add('tags-list');
    let tagsListTitle = document.createElement('p');
    tagsListTitle.classList.add('tags-list__title');
    tagsListTitle.innerHTML = "List of available tags:";
    HEADER_TAGS.appendChild(tagsListTitle);
    for (let headerTag of tags) {
        let tag = document.createElement('li');
        tag.classList.add('tags-list__tag');
        tag.innerHTML = headerTag;
        if (savedTags.has(headerTag)) {
            tag.classList.add(TAG_LIST_SELECTED);
        }
        tag.addEventListener('click', () => {
            if (tag.classList.contains(TAG_LIST_SELECTED)) {
                tag.classList.remove(TAG_LIST_SELECTED);
            } else {
                tag.classList.add(TAG_LIST_SELECTED);
            }
        });
        headerTags.appendChild(tag);
    }
    HEADER_TAGS.appendChild(headerTags);
    let applyTags = document.createElement('li');
    applyTags.classList.add('tags-list__apply');
    applyTags.addEventListener('click', () => {
        let selectTags = document.getElementsByClassName(TAG_LIST_SELECTED);
        let tags = [].map.call(selectTags, (liItem) => liItem.innerHTML);
        localStorage.setItem('tags', tags);
        location.reload();
    });
    headerTags.appendChild(applyTags);
    let applyIcon = document.createElement('span');
    applyIcon.classList.add('fa', 'fa-check-circle');
    applyTags.appendChild(applyIcon);
}
function addPost(post) {
    let dataWrapper = document.createElement('div');
    dataWrapper.classList.add('content__data');
    let postTitle = document.createElement('h3');
    postTitle.classList.add('post__title');
    postTitle.innerHTML = post['title'];
    let postTags = document.createElement('ul');
    postTags.classList.add('post__tags');
    for (let postTag of post['tags']) {
        let tag = document.createElement('li');
        tag.classList.add('tags-list__tag');
        if (savedTags.has(postTag)) {
            tag.classList.add(TAG_SELECTED);
        }
        tag.innerHTML = postTag;
        tag.addEventListener('click', () => {
            localStorage.clear();
            localStorage.setItem('tags', postTag);
            location.reload();
        });
        postTags.appendChild(tag);
    }
    let postImage = document.createElement('img');
    postImage.classList.add('post__image');
    postImage.src = post['image'];
    postImage.alt = 'image_placeholder';
    let postText = document.createElement('p');
    postText.classList.add('post__text');
    postText.innerHTML = post['description'];
    let postCreated = document.createElement('p');
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'};
    postCreated.classList.add('post__date');
    postCreated.innerHTML = new Date(post['createdAt']).toLocaleString('en-GB', options);
    let postDelete = document.createElement('span');
    postDelete.classList.add('post__delete', 'fa', 'fa-close');
    postDelete.addEventListener('click', () => {
        PAGE_CONTENT.removeChild(dataWrapper);
    });
    PAGE_CONTENT.appendChild(dataWrapper);
    dataWrapper.appendChild(postTitle);
    dataWrapper.appendChild(postTags);
    dataWrapper.appendChild(postImage);
    dataWrapper.appendChild(postText);
    dataWrapper.appendChild(postCreated);
    dataWrapper.appendChild(postDelete);
    
}

function generatePosts(posts) {
    if (posts) {
        for (let post of posts) {
            addPost(post);
        }
    }
}

function sortByDate(post1, post2) {
    return new Date(post2['createdAt']) - new Date(post1['createdAt']);
}

function collectPostTags(post) {
    post['tags'].forEach(tagsSet.add, tagsSet);
}
